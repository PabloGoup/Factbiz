import type { Metadata } from "next";

import "@/app/globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Factibiz",
  description: "Plataforma académica para evaluar la factibilidad de proyectos de negocio.",
  applicationName: "Factibiz"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <div className="relative min-h-screen">
            <SiteHeader />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
