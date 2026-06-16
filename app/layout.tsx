import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layout-client";

const poppinsSans = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard | KulturAR",
  description: "Admin overview for user creation and activity metrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html
      lang="en"
      className={`${poppinsSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
