import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backlog",
  description: "A simple, modern task backlog board.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="text-slate-100 antialiased">{children}</body>
    </html>
  );
}
