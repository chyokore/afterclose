import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfterClose | Understand the gap",
  description: "Tokenized-stock research on BNB Smart Chain. Understand the price, the reference, and what is missing.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;
}
