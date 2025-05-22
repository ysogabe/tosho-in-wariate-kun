import type { Metadata, Viewport } from "next";
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/700.css';
import "./globals.css";
import { SchoolProvider } from "../contexts/SchoolContext";

const fontFamily = 'Noto Sans JP, sans-serif';

export const metadata: Metadata = {
  title: {
    default: "図書当番割り当てくん",
    template: "%s | 図書当番割り当てくん"
  },
  description: "図書委員会の当番割り当てを管理するシステム",
  applicationName: "図書当番割り当てくん",
  authors: [{ name: "さくら小学校" }],
  generator: "Next.js",
  keywords: ["図書委員", "当番管理", "スケジュール", "小学校"],
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#b4e6e6" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#b4e6e6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`antialiased h-full ${fontFamily} bg-background text-foreground`}>
        <div className="min-h-full flex flex-col">
          <SchoolProvider>
            {children}
          </SchoolProvider>
        </div>
      </body>
    </html>
  );
}
