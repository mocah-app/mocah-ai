import Providers from "@/components/providers";
import type { Metadata } from "next";
import "../index.css";


export const metadata: Metadata = {
  title: "Mocah",
  description: "AI email template builder for modern brands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <meta name="apple-mobile-web-app-title" content="Mocah" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
