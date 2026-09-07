import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "abelas - Absensi Kelas Berbasis QR",
  description: "Web application absensi kelas berbasis QR Code modern, cepat, dan mobile-first.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-square.jpg",
    apple: "/logo-square.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#C2B535",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F5F5F5] text-[#191E24] flex">
        <AuthProvider>
          <div className="flex w-full min-h-screen">
            {/* Desktop Sidebar (Left) */}
            <Sidebar />

            {/* Main Content Area (Right) */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-5 sm:py-8 pb-24 lg:pb-8">
                {children}
              </main>

              {/* Mobile Bottom Navigation (Bottom) */}
              <BottomNav />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
