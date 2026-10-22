import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UmbraPizza — Painel",
  description: "Painel da cozinha e administração de pedidos da pizzaria",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          theme="dark"
          // embaixo para não cobrir a navegação do cabeçalho
          position="bottom-right"
          richColors
          toastOptions={{ style: { background: "#1d1d2e", border: "1px solid #2c2c42" } }}
        />
      </body>
    </html>
  );
}
