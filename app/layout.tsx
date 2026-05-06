import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../lib/trpc-provider";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Филворд — Многопользовательская игра",
  description: "Игра в филворд с друзьями. Найдите слова в сетке букв!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Безопасное получение ID — если переменная не задана, скрипт не загружается
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  
  return (
    <html lang="ru" className={inter.variable}>
      <body className={`font-sans ${inter.variable}`}>
        <TRPCProvider>
          {children}
        </TRPCProvider>
        
        {/* Clarity скрипт — загружается только если есть ID */}
        {clarityId && (
          <Script
            id="clarity-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}