import { useEffect } from "react";
import { CONSENT_UPDATED_EVENT, readConsent } from "@/lib/consent";

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
  useEffect(() => {
    const raw = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const ga4Raw = raw(import.meta.env.VITE_GA4_MEASUREMENT_ID);
    const klaviyoRaw = raw(import.meta.env.VITE_KLAVIYO_COMPANY_ID);
    const tidioRaw = raw(import.meta.env.VITE_TIDIO_PUBLIC_KEY);
    const judgeMeDomain = raw(import.meta.env.VITE_JUDGEME_SHOP_DOMAIN);
    const judgeMeTokenRaw = raw(import.meta.env.VITE_JUDGEME_PUBLIC_TOKEN);
    const metaPixelRaw = raw(import.meta.env.VITE_META_PIXEL_ID);
    const ga4 = /^G-[A-Z0-9]{4,}$/i.test(ga4Raw) ? ga4Raw : "";
    const klaviyo = /^[A-Z0-9]{4,}$/i.test(klaviyoRaw) ? klaviyoRaw : "";
    const tidio = /^[A-Za-z0-9]{6,}$/.test(tidioRaw) ? tidioRaw : "";
    const judgeMe =
      /^[a-z0-9.-]+\.myshopify\.com$/i.test(judgeMeDomain) && judgeMeTokenRaw
        ? { domain: judgeMeDomain, token: judgeMeTokenRaw }
        : null;
    const metaPixel = /^\d{6,}$/.test(metaPixelRaw) ? metaPixelRaw : "";

    const injected: HTMLScriptElement[] = [];

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
        inject("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
        if (!document.getElementById("ga4-config")) {
          const cfg = document.createElement("script");
          cfg.id = "ga4-config";
          cfg.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`;
          document.head.appendChild(cfg);
          injected.push(cfg);
        }
      } else {
        removeById("ga4-loader");
        removeById("ga4-config");
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
        // Judge.me widget script. Requires shop domain + public token.
        inject("judgeme-loader", `https://cdn.judge.me/widget_preloader.js`);
        if (!document.getElementById("judgeme-config")) {
          const cfg = document.createElement("script");
          cfg.id = "judgeme-config";
          cfg.innerHTML = `window.jdgm=window.jdgm||{};jdgm.SHOP_DOMAIN='${judgeMe.domain}';jdgm.PLATFORM='shopify';jdgm.PUBLIC_TOKEN='${judgeMe.token}';`;
          document.head.appendChild(cfg);
          injected.push(cfg);
        }
      } else {
        removeById("judgeme-loader");
        removeById("judgeme-config");
      }
      if (metaPixel && c.marketing) {
        if (!document.getElementById("meta-pixel-init")) {
          const s = document.createElement("script");
          s.id = "meta-pixel-init";
          s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixel}');fbq('track','PageView');`;
          document.head.appendChild(s);
          injected.push(s);
        }
      } else {
        removeById("meta-pixel-init");
      }
    };

    apply();
    window.addEventListener(CONSENT_UPDATED_EVENT, apply);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, apply);
      injected.forEach((s) => s.parentNode?.removeChild(s));
    };
  }, []);

  return null;
}
