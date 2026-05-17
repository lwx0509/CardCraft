// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const MANIFEST = {
  name: "Invite Studio",
  short_name: "Invites",
  description:
    "Design beautiful custom invitations for weddings, birthdays, baby showers, parties and more.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#FAF9F6",
  theme_color: "#E26D5A",
  icons: [
    {
      src: "/assets/assets/images/icon.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/assets/assets/images/favicon.png",
      sizes: "192x192",
      type: "image/png",
    },
  ],
};

const MANIFEST_DATA_URI =
  "data:application/manifest+json;charset=utf-8," +
  encodeURIComponent(JSON.stringify(MANIFEST));

const PWA_REGISTER = `
(function() {
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function(){});
      });
    }
  } catch (e) { /* noop */ }
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Invite Studio — Custom event invitations</title>
        <meta
          name="description"
          content="Design beautiful custom invitations for weddings, birthdays, baby showers, parties and more."
        />
        <meta name="theme-color" content="#E26D5A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="Invite Studio" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href={MANIFEST_DATA_URI} />
        <link rel="apple-touch-icon" href="/assets/assets/images/icon.png" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { background: #FAF9F6; }
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              ::-webkit-scrollbar { width: 10px; height: 10px; }
              ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 8px; }
              ::-webkit-scrollbar-track { background: transparent; }
            `,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: PWA_REGISTER }} />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
