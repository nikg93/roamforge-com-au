import { useEffect } from "react";

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
    // Only accept real-looking IDs so a stray placeholder in .env doesn't
    // inject broken scripts at runtime. Never fabricate defaults.
    const raw = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const ga4Raw = raw(import.meta.env.VITE_GA4_MEASUREMENT_ID);
    const klaviyoRaw = raw(import.meta.env.VITE_KLAVIYO_COMPANY_ID);
    const tidioRaw = raw(import.meta.env.VITE_TIDIO_PUBLIC_KEY);
    const ga4 = /^G-[A-Z0-9]{4,}$/i.test(ga4Raw) ? ga4Raw : "";
    const klaviyo = /^[A-Z0-9]{4,}$/i.test(klaviyoRaw) ? klaviyoRaw : "";
    const tidio = /^[A-Za-z0-9]{6,}$/.test(tidioRaw) ? tidioRaw : "";

    const loaded = new Set<string>();
    const injected: HTMLScriptElement[] = [];

    const inject = (id: string, src: string, extra?: (s: HTMLScriptElement) => void) => {
      if (loaded.has(id) || document.getElementById(id)) return;
      const s = document.createElement("script");
      s.id = id;
      s.src = src;
      s.async = true;
      extra?.(s);
      document.head.appendChild(s);
      injected.push(s);
      loaded.add(id);
    };

    // Google Analytics 4
    if (ga4) {
      inject("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
      const cfg = document.createElement("script");
      cfg.id = "ga4-config";
      cfg.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`;
      document.head.appendChild(cfg);
      injected.push(cfg);
    }

    // Klaviyo
    if (klaviyo) {
      inject(
        "klaviyo-loader",
        `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyo}`,
      );
    }

    // Tidio live chat
    if (tidio) {
      inject("tidio-loader", `//code.tidio.co/${tidio}.js`);
    }

    return () => {
      injected.forEach((s) => s.parentNode?.removeChild(s));
      loaded.clear();
    };
  }, []);

  return null;
}
