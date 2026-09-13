import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REFUSAL.eth — policy before signing",
  description: "A deny-by-default transaction gate for AI agent wallets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
