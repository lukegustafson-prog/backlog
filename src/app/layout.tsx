import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backlog",
  description: "A clean daily agenda for your tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-[#37352f]">{children}</body>
    </html>
  );
}
