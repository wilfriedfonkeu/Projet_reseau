import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/src/components/ui/sonner";
import { LangProvider } from "@/src/lib/lang";
import { AuthProvider } from "@/src/lib/auth-context";

export const metadata: Metadata = {
  title: "Njangui — Des souvenirs, au-delà des frontières",
  description: "Plateforme camerounaise de tourisme : packs, circuits, hébergements et réservations en ligne.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LangProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
