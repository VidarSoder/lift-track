import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Training · Vidar",
  description:
    "Phone-first training log. Log sets, track progress, and start training from your phone.",
  applicationName: "Training",
  appleWebApp: {
    capable: true,
    title: "Training",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1612",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="bg-background font-sans text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var n=window.navigator;if(n.standalone||window.matchMedia("(display-mode:standalone)").matches||window.matchMedia("(display-mode:fullscreen)").matches){var r=document.documentElement;r.classList.add("is-standalone");r.style.setProperty("--app-height","100vh")}}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
