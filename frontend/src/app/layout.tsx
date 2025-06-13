import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Home, Users, Wrench, ListOrdered } from 'lucide-react';

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
              <Link href="/" className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="h-6 w-6" />
                AutoService Manager
              </Link>
              
              <div className="flex space-x-6">
                <Link href="/" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded transition">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/customers" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded transition">
                  <Users className="h-4 w-4" />
                  Klienci
                </Link>
                <Link href="/orders" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded transition">
                  <ListOrdered className="h-4 w-4" />
                  Zlecenia
                </Link>
                <Link href="/queue" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded transition">
                  <Wrench className="h-4 w-4" />
                  Kolejka
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}