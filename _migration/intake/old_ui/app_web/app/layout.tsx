import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/shell/Header";
import { ShellContent } from "@/components/shell/ShellContent";
import { CommandPalette } from "@/components/palette/CommandPalette";

// Self-hosted Inter — Next downloads the font at build time and serves it
// from the same origin. No external requests at runtime.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FlavorOS",
  description: "Calm by default. Voice-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Header />
        <ShellContent>{children}</ShellContent>
        <CommandPalette />
      </body>
    </html>
  );
}
