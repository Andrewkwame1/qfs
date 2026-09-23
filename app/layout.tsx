import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QFS – Your Financial Freedom Begins here",
  description:
    "Unlock your financial freedom with QFS. Discover innovative solutions for secure and efficient financial management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className={dmSans.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}