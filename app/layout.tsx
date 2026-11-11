import type { Metadata, Viewport } from "next";
import { Anek_Tamil, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Khata Voice",
  description: "Say a bill out loud in Tamil. Get a PayPal payment request.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f8fc" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}