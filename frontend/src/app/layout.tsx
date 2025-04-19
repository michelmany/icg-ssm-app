import type { Metadata } from "next";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Related Services Manager",
  description: "Related Services Manager project.",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full bg-white">
      <body
        className={`${inter.className} bg-white text-black h-full dark:bg-white dark:text-black antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
