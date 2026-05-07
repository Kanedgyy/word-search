import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "../lib/trpc-provider";

export const metadata: Metadata = {
  title: "Филворд — Многопользовательская игра",
  description: "Игра в филворд с друзьями. Найдите слова в сетке букв!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ru">
      <body className="font-sans">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
