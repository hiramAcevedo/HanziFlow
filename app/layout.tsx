import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HanziFlow - Práctica de escritura china",
  description: "Aprende a escribir caracteres chinos con animaciones de trazos interactivas. Practica oraciones completas en lugar de carácter por carácter.",
  keywords: ["chino", "mandarín", "hanzi", "trazos", "escritura", "aprendizaje", "idiomas"],
  authors: [{ name: "HanziFlow" }],
  openGraph: {
    title: "HanziFlow - Práctica de escritura china",
    description: "Aprende a escribir caracteres chinos con animaciones de trazos interactivas",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
