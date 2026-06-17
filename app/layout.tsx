import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Productivity Dashboard",
  description: "A personal productivity dashboard with tasks, notes, habits, and links.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
