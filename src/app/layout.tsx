import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceTicker from "@/components/PriceTicker";
import {MetalPricesProvider} from "@/contexts/MetalPricesContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider} from "@/contexts/CurrencyContext";
import { Toaster } from 'sonner';
// TODO MIGRATION SUPABASE ALTER CUSTOMERS DOCUMENT ADD CERT FIELDS DONE
//TODO  ORDER CONFIRMATION TOTAL AMOUNT NOT MATCHING DONE
//TODO ADDRESS OPTIONAL NAME ON SIGN UP
//TODO CLICKING ALTERNATIVE DOCUMENTS GETS STRIPE TO FREEEZE UP
// MANAGEMENT APPROVAL MIGHT NEED IMPLEMENTATION?
//TODO DUPLICATE EMAIL SENT AFTER RESUME DONE
// RESUME TRANSACTION ORDER EMAIL
//TODO TTR EMAIL NOT SHOOTING OFF
//TODO AMOUNT FROM RESUMING NOT MATCHING ORIGINAL

//UNVERFIIED
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
            <CurrencyProvider>
              <CartProvider>
                <Toaster position="top-center" richColors closeButton />
                <PriceTicker />
                <Header />
                {children}
                <Footer />
              </CartProvider>
            </CurrencyProvider>
          </MetalPricesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
