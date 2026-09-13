import type { Metadata } from "next";

export const metadata: Metadata = { title: "REFUSAL.eth", description: "Deny-by-default firewall for AI agents" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", color: "#eee" }}>{children}</body>
    </html>
  );
}
