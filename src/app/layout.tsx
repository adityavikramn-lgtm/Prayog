import { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "../../styles/global.css";

// Designed for legibility; the scenes use the same family.
const font = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prayog Studio",
  description:
    "Physics-true animations and verified JEE practice, built for JEE teachers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1915",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${font.className} bg-board text-chalk antialiased`}>{children}</body>
    </html>
  );
}
