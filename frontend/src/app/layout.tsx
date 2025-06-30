import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {Home, Users, Wrench, Car, ListOrdered, Package} from "lucide-react";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoService Manager",
  description: "System zarządzania warsztatem samochodowym",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link
                href="/"
                className="text-xl md:text-2xl font-bold flex items-center gap-2"
              >
                <Wrench className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline">AutoService Manager</span>
                <span className="sm:hidden">ASM</span>
              </Link>

              {/* Menu mobilne */}
              <div className="flex space-x-3 md:space-x-6 overflow-x-auto">
                <Link
                  href="/"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
                <Link
                  href="/customers"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm md:text-base">Klienci</span>
                </Link>
                <Link
                  href="/vehicles"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <Car className="h-4 w-4" />
                  <span className="text-sm md:text-base">Pojazdy</span>
                </Link>
                <Link
                  href="/parts"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <Package className="h-4 w-4" />
                  <span className="text-sm md:text-base">Części</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <ListOrdered className="h-4 w-4" />
                  <span className="hidden md:inline">Zlecenia</span>
                </Link>
                <Link
                  href="/queue"
                  className="flex items-center gap-1 md:gap-2 hover:bg-blue-700 px-2 md:px-3 py-2 rounded transition whitespace-nowrap"
                >
                  <Wrench className="h-4 w-4" />
                  <span className="hidden md:inline">Kolejka</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <Providers>{children}</Providers>
          </div>
        </main>
      </body>
    </html>
  );
}
