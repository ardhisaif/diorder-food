/// <reference types="vite/client" />

interface Window {
  gtag: (
    command: "event" | "config" | "set" | "js",
    action: string,
    params?: Record<string, unknown>
  ) => void;
  dataLayer: any[];
}
