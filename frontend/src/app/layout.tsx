'use client';

// import type { Metadata } from "next";
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import { Toaster } from 'react-hot-toast';
import "./globals.css";

// export const metadata: Metadata = {
//   title: "نظام الشات الفوري",
//   description: "نظام شات فوري مبني بـ Next.js و Node.js",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <GeistProvider>
          <CssBaseline />
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </GeistProvider>
      </body>
    </html>
  );
}
