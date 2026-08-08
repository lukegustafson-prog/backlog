import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backlog",
  description: "A clean daily agenda for your tasks.",
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
      <body className="bg-canvas text-ink">{children}</body>
    </html>
  );
}
