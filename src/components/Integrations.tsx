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
    const ga4 = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
    const klaviyo = import.meta.env.VITE_KLAVIYO_COMPANY_ID as string | undefined;
    const tidio = import.meta.env.VITE_TIDIO_PUBLIC_KEY as string | undefined;

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
        `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyo}`
      );
    }

    // Tidio live chat
    if (tidio) {
      inject("tidio-loader", `//code.tidio.co/${tidio}.js`);
    }

    return () => {
      injected.forEach((s) => s.parentNode?.removeChild(s));
    };
  }, []);

  return null;
}