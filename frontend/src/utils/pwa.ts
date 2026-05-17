import { useEffect, useState } from "react";
import { Platform } from "react-native";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("invite-studio:install-available"));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event("invite-studio:install-installed"));
  });
}

export function useInstallPrompt() {
  const [available, setAvailable] = useState<boolean>(!!deferredPrompt);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onAvail = () => setAvailable(true);
    const onInstalled = () => {
      setAvailable(false);
      setInstalled(true);
    };
    window.addEventListener("invite-studio:install-available", onAvail);
    window.addEventListener("invite-studio:install-installed", onInstalled);
    // Detect standalone mode → already installed
    try {
      // @ts-ignore
      if (window.matchMedia?.("(display-mode: standalone)").matches) {
        setInstalled(true);
      }
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener("invite-studio:install-available", onAvail);
      window.removeEventListener("invite-studio:install-installed", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      setAvailable(false);
      return choice.outcome;
    } catch {
      return "unavailable";
    }
  };

  return { available, installed, promptInstall };
}

export function isWeb(): boolean {
  return Platform.OS === "web";
}
