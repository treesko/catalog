import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catallogu — Pharmacy Management",
  description: "Pharmacy product catalog and order management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full noise-bg">{children}</body>
    </html>
  );
}
