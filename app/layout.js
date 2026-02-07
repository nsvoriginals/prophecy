import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import 'globalthis/polyfill';

import WalletContextProvider from "@/components/WalletContextProvider";
import '@solana/wallet-adapter-react-ui/styles.css';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Prophecy",
  description: "Onchain Prediction Market ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
