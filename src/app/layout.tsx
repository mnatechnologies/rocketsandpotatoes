import type { Metadata } from 'next';
import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceTicker from "@/components/PriceTicker";
import PriceLockBar from "@/components/PriceLockBar";
import {MetalPricesProvider} from "@/contexts/MetalPricesContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider} from "@/contexts/CurrencyContext";
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/contexts/Themecontext";
//  MIGRATION SUPABASE ALTER CUSTOMERS DOCUMENT ADD CERT FIELDS DONE
// ORDER CONFIRMATION TOTAL AMOUNT NOT MATCHING DONE
//ADDRESS OPTIONAL NAME ON SIGN UP DONE
// CLICKING ALTERNATIVE DOCUMENTS GETS STRIPE TO FREEZE UP DONE
// MANAGEMENT APPROVAL MIGHT NEED IMPLEMENTATION? DONE 
//  DUPLICATE EMAIL SENT AFTER RESUME DONE
//  RESUME TRANSACTION ORDER EMAIL
// TTR EMAIL NOT SHOOTING OFF
//AMOUNT FROM RESUMING NOT MATCHING ORIGINAL
// TODO FIX DATE CHECKER AND REDIRECT FROM CLERK, PEP CHECKBOX,

//UNVERiFIED
import {
  ClerkProvider,
  } from '@clerk/nextjs'

const aptosSemiBold = localFont({
  src: "../fonts/Aptos-SemiBold.ttf",
  variable: "--font-aptos",
  weight: "600",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Australian National Bullion | Premium Precious Metals",
  description: "Australia's trusted AUSTRAC-registered bullion dealer. Buy gold, silver, platinum and palladium with live market pricing and guaranteed authenticity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${aptosSemiBold.variable} ${playfairDisplay.variable} ${inter.variable} antialiased`}>
          <ThemeProvider>
            <MetalPricesProvider>
              <CurrencyProvider>
                <CartProvider>
                  <Toaster position="top-center" richColors closeButton />
                  <Header />
                  <PriceTicker />
                  <PriceLockBar />
                  {children}
                  <Footer />
                </CartProvider>
              </CurrencyProvider>
            </MetalPricesProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
