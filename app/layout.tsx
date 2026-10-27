import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Refinamiento institucional: Montserrat, la misma tipografía de Regalos de
// Navidad (proyecto hermano de la Municipalidad). Variable font: un solo
// archivo cubre todos los pesos que usa el sistema (400–800).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ayudas Sociales — Municipalidad de Coinco",
  description: "Sistema de administración de ayudas sociales del Departamento Social",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CL"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
