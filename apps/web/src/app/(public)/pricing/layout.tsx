import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Mocah",
  description: "Choose the perfect plan for your email marketing needs. Start with a 7-day free trial.",
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

