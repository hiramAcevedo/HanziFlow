import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  // Configuración para PWA (se puede agregar con next-pwa después)
  // PWA config will be added here
};

export default nextConfig;
