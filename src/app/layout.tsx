import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceTicker from "@/components/PriceTicker";
import {MetalPricesProvider} from "@/contexts/MetalPricesContext";
import { CartProvider } from "@/contexts/CartContext";

import {
  ClerkProvider,
  } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Australian National Bullion",
  description: "Premium bullion store UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <MetalPricesProvider>
            <CartProvider>
              <PriceTicker />
              <Header />
              {children}
              <Footer />
            </CartProvider>
          </MetalPricesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
