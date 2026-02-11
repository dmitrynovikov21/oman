import "./globals.css";

import { Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const metadata = {
  title: "ExpertOS — Цифровая платформа для судебных экспертов",
  description: "Автоматизация OCR, расчет трудовых выплат, генерация документов для экспертов в Омане.",
  openGraph: {
    title: "ExpertOS",
    description: "Цифровая платформа для судебных экспертов в Омане",
    type: "website",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background antialiased relative", manrope.className)}>
        {/* Layer 1: Dark base background */}
        <div className="fixed inset-0 z-[-3] pointer-events-none bg-[#040405]" />
        {/* Layer 2: Star particles — z-[-1] so section bg images at z-[-2] sit below */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <img
            src="/assets/hero/Clip path group.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
