import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FloatingHearts from "@/components/FloatingHearts";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Felix & Hana | Timeline of Us",
  description: "Nơi lưu giữ những kỷ niệm đẹp của Felix & Hana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <FloatingHearts />
        <Navbar />
        <main className="relative z-10 pt-16 min-h-screen">{children}</main>
        <footer className="relative z-10 text-center py-6 text-sm text-rose-300 border-t border-rose-100">
          Made with &#x2764; by Felix & Hana
        </footer>
      </body>
    </html>
  );
}
