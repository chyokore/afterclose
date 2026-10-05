import type { Metadata } from "next";
import { previewMode } from "@/lib/preview-mode";
import "./globals.css";

export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const synthetic = previewMode() === "synthetic";
  return {
    title: synthetic ? "AfterClose | Synthetic demo" : "AfterClose | Understand the gap",
    description: synthetic ? "SYNTHETIC DEMO — NOT LIVE MARKET DATA. Fictional research scenarios; execution disabled." : "Tokenized-stock research on BNB Smart Chain. Understand the price, the reference, and what is missing.",
    robots: { index: false, follow: false },
  };
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const synthetic = previewMode() === "synthetic";
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{synthetic && <div className="demo-banner" role="status">SYNTHETIC DEMO — NOT LIVE MARKET DATA</div>}{children}</body></html>;
}
