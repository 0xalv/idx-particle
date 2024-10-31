import { ParticleConnectkit } from "@/connectkit";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IDX Finance App",
  description: "Easily create and buy crypto indexes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ParticleConnectkit>
          <Header />
          {children}
        </ParticleConnectkit>
      </body>
    </html>
  );
}
