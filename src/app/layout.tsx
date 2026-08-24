import type { Metadata, Viewport } from "next";
import "./globals.css";
import PhoneFrame from "@/components/PhoneFrame";

export const metadata: Metadata = {
  title: "Backlog",
  description: "A clean daily agenda for your tasks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Applied before paint to avoid a flash of the wrong theme.
const themeScript = `try{var t=localStorage.getItem('backlog-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="text-ink">
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
