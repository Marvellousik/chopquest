import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChopQuest",
  description: "Keep your jollof, upgrade your protein.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* Bottom padding keeps content clear of the fixed nav (--nav-h + phone safe area). */}
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
