import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { CONSENT_UPDATED_EVENT, readConsent } from "@/lib/consent";
import { trackGa4, trackMeta } from "@/lib/analytics";
import { ANALYTICS } from "@/lib/site";
import { captureAttribution } from "@/lib/attribution";

/**
 * Third-party app integrations. Each one activates only when its VITE_ env var is set.
 *
 * To enable, add the corresponding value in your Lovable project env / .env:
 *   VITE_GA4_MEASUREMENT_ID     e.g. G-XXXXXXXXXX          (Google Analytics 4)
 *   VITE_KLAVIYO_COMPANY_ID     e.g. ABC123                (Klaviyo — email capture / marketing)
 *   VITE_TIDIO_PUBLIC_KEY       e.g. abcd1234...           (Tidio live chat)
 *   VITE_JUDGEME_SHOP_DOMAIN    e.g. xmszfz-pj.myshopify.com   (Judge.me reviews — with token below)
 *   VITE_JUDGEME_PUBLIC_TOKEN   Judge.me public token
 */
export function Integrations() {
  const location = useLocation();
  const initialPageView = useRef(true);

  useEffect(() => {
    const raw = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    // No hardcoded fallbacks — every third-party ID MUST come from env.
    // This avoids cross-project attribution when a fork / preview loads
    // the bundle without its own env configured. In dev, warn once when
    // an integration is left unconfigured so it is obvious to operators.
    // GA4 Measurement IDs are public client-side identifiers, so the verified
    // Roamforge production ID lives in site config as a fallback. Setting
    // VITE_GA4_MEASUREMENT_ID still overrides it.
    const ga4Raw = raw(ANALYTICS.ga4MeasurementId);
    const klaviyoRaw = raw(import.meta.env.VITE_KLAVIYO_COMPANY_ID);
    const tidioRaw = raw(import.meta.env.VITE_TIDIO_PUBLIC_KEY);
    const judgeMeDomain = raw(import.meta.env.VITE_JUDGEME_SHOP_DOMAIN);
    const judgeMeTokenRaw = raw(import.meta.env.VITE_JUDGEME_PUBLIC_TOKEN);
    // Public Meta Pixel ID — env override with sanitised production fallback.
    const metaPixelRaw = raw(ANALYTICS.metaPixelId);
    const ga4 = /^G-[A-Z0-9]{4,}$/i.test(ga4Raw) ? ga4Raw : "";
    const klaviyo = /^[A-Z0-9]{4,}$/i.test(klaviyoRaw) ? klaviyoRaw : "";
    const tidio = /^[A-Za-z0-9]{6,}$/.test(tidioRaw) ? tidioRaw : "";
    const judgeMe =
      /^[a-z0-9.-]+\.myshopify\.com$/i.test(judgeMeDomain) && judgeMeTokenRaw
        ? { domain: judgeMeDomain, token: judgeMeTokenRaw }
        : null;
    const metaPixel = /^\d{6,}$/.test(metaPixelRaw) ? metaPixelRaw : "";

    if (import.meta.env.DEV) {
      const missing: string[] = [];
      if (!ga4) missing.push("VITE_GA4_MEASUREMENT_ID");
      if (!klaviyo) missing.push("VITE_KLAVIYO_COMPANY_ID");
      if (!tidio) missing.push("VITE_TIDIO_PUBLIC_KEY");
      if (!judgeMe) missing.push("VITE_JUDGEME_SHOP_DOMAIN + VITE_JUDGEME_PUBLIC_TOKEN");
      if (!metaPixel) missing.push("VITE_META_PIXEL_ID");
      if (missing.length) {
        // eslint-disable-next-line no-console
        console.info("[Integrations] not configured:", missing.join(", "));
      }
    }

    const injected: HTMLScriptElement[] = [];
    let gaConfigured = false;
    let metaConfigured = false;

    type Gtag = (...args: unknown[]) => void;
    type Fbq = ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      push: (...args: unknown[]) => void;
      loaded: boolean;
      version: string;
    };
    type IntegrationWindow = Window & {
      dataLayer?: unknown[];
      gtag?: Gtag;
      fbq?: Fbq;
      _fbq?: Fbq;
      jdgm?: Record<string, unknown>;
    };
    const w = window as IntegrationWindow;

    const inject = (id: string, src: string) => {
      if (document.getElementById(id)) return;
      const s = document.createElement("script");
      s.id = id;
      s.src = src;
      s.async = true;
      document.head.appendChild(s);
      injected.push(s);
    };
    const removeById = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.parentNode?.removeChild(el);
    };

    // Idempotent — recomputes what should be loaded based on the current
    // consent state and inserts/removes tags accordingly.
    const apply = () => {
      const c = readConsent();
      if (ga4 && c.analytics) {
        w.dataLayer = Array.isArray(w.dataLayer) ? w.dataLayer : [];
        // gtag.js identifies `js` / `config` / `event` commands by the native
        // `arguments` object. Pushing a plain array instead makes gtag.js
        // silently ignore every command: the library loads and `config` sits
        // in dataLayer, but no /g/collect hit is ever sent. Must be a
        // `function` (not an arrow) so `arguments` exists.
        if (!w.gtag) {
          w.gtag = function gtag() {
            // eslint-disable-next-line prefer-rest-params
            w.dataLayer?.push(arguments);
          } as Gtag;
        }
        if (!gaConfigured) {
          w.gtag("js", new Date());
          // `beacon` transport makes gtag.js dispatch hits via
          // navigator.sendBeacon, which survives page teardown. Without it a
          // queued hit is discarded when the tab navigates cross-origin to
          // Shopify checkout, silently losing begin_checkout.
          w.gtag("config", ga4, { transport_type: "beacon" });
          gaConfigured = true;
        }
        inject("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
      } else {
        w.gtag?.("consent", "update", { analytics_storage: "denied" });
        removeById("ga4-loader");
      }
      if (klaviyo && c.marketing) {
        inject(
          "klaviyo-loader",
          `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyo}`,
        );
      } else {
        removeById("klaviyo-loader");
      }
      if (tidio && c.marketing) {
        inject("tidio-loader", `//code.tidio.co/${tidio}.js`);
      } else {
        removeById("tidio-loader");
      }
      if (judgeMe && c.marketing) {
        w.jdgm = {
          ...(w.jdgm || {}),
          SHOP_DOMAIN: judgeMe.domain,
          PLATFORM: "shopify",
          PUBLIC_TOKEN: judgeMe.token,
        };
        inject("judgeme-loader", "https://cdn.judge.me/widget_preloader.js");
      } else {
        removeById("judgeme-loader");
      }
      if (metaPixel && c.marketing) {
        if (!w.fbq) {
          const fbq = ((...args: unknown[]) => {
            if (fbq.callMethod) fbq.callMethod(...args);
            else fbq.queue.push(args);
          }) as Fbq;
          fbq.push = fbq;
          fbq.loaded = true;
          fbq.version = "2.0";
          fbq.queue = [];
          w.fbq = fbq;
          w._fbq = fbq;
        }
        inject("meta-pixel-loader", "https://connect.facebook.net/en_US/fbevents.js");
        if (!metaConfigured) {
          w.fbq("init", metaPixel);
          w.fbq("track", "PageView");
          metaConfigured = true;
        }
      } else {
        removeById("meta-pixel-loader");
      }
    };

    apply();
    window.addEventListener(CONSENT_UPDATED_EVENT, apply);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, apply);
      injected.forEach((s) => s.parentNode?.removeChild(s));
    };
  }, []);

  useEffect(() => {
    // Capture campaign params on every navigation (the first ad-click landing
    // wins for the session) so the Shopify checkout handoff can forward them.
    captureAttribution();
    if (initialPageView.current) {
      initialPageView.current = false;
      return;
    }
    trackGa4("page_view", {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.searchStr || ""}`,
      page_title: document.title,
    });
    trackMeta("PageView");
  }, [location.pathname, location.searchStr]);

  return null;
}
