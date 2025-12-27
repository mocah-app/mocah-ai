import Providers from "@/components/providers";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "../index.css";

export const metadata: Metadata = {
  title: {
    default: "Mocah",
    template: "%s | Mocah",
  },
  description: "AI email template builder for modern brands",
  applicationName: "Mocah",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mocah",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Mocah",
    title: "Mocah",
    description: "AI email template builder for modern brands",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mocah",
    description: "AI email template builder for modern brands",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/' });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
