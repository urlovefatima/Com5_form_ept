import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COM5 – Ton avis aussi compte ! · EPT",
  description: "Une promotion, cinq commissions, une vision commune. Partage tes idées pour construire la feuille de route de la COM5 de l'École Polytechnique de Thiès.",
  icons: { icon: "/images/emblem-ept.png" },
};

export const viewport: Viewport = { themeColor: "#0B2545", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
