import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewsletterForm } from "@/components/NewsletterForm";

const STORAGE_KEY = "roamforge-welcome-popup-v1";
const DELAY_MS = 12_000;

function alreadySeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* swallow */
  }
}

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (alreadySeen()) return;
    let cancelled = false;
    const show = () => {
      if (cancelled || alreadySeen()) return;
      markSeen();
      setOpen(true);
    };
    const timer = window.setTimeout(show, DELAY_MS);
    const onExit = (e: MouseEvent) => {
      if (e.clientY <= 4) show();
    };
    document.addEventListener("mouseleave", onExit);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("mouseleave", onExit);
    };
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-widest text-rf-dark">
            5% OFF YOUR FIRST ORDER
          </DialogTitle>
          <DialogDescription>
            Join the Roamforge list for early access to new gear, tour-tested drops, and a welcome
            code for 5% off your first order.
          </DialogDescription>
        </DialogHeader>
        <NewsletterForm variant="popup" source="welcome-popup" onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
