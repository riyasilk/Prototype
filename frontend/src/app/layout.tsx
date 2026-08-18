import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Custom Uniform Manufacturer & Bulk Supplier | Riya Silk",
  description:
    "Riya Silk designs & manufactures premium custom uniforms at scale. Sourcing bulk workwear for corporate, healthcare, schools & industries across India.",
  keywords: [
    "uniform manufacturer India",
    "bulk uniform supplier",
    "corporate workwear manufacturer",
    "healthcare uniforms India",
    "school uniforms manufacturer",
    "industrial workwear",
    "custom uniform printing",
    "B2B uniform manufacturer Maharashtra",
  ],
  authors: [{ name: "Riya Silk" }],
  creator: "Riya Silk",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_API_URL || "https://riyasilk.com",
    siteName: "Riya Silk",
    title: "Custom Uniform Manufacturer & Bulk Supplier | Riya Silk",
    description:
      "Riya Silk manufactures premium custom uniforms at scale — corporate, healthcare, schools, hospitality & industrial. Pan-India delivery. Request samples today.",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Riya Silk — Custom Uniform Manufacturer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Uniform Manufacturer & Bulk Supplier | Riya Silk",
    description:
      "Riya Silk manufactures premium custom uniforms at scale — corporate, healthcare, schools, hospitality & industrial. Pan-India delivery.",
    images: ["/og-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
