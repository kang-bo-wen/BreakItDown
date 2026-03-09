import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Sidebar from './components/Sidebar';
import TopNavBar from './components/TopNavBar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Break It Down - Deconstruction',
  description: 'Interactive Mine & Craft game - Deconstruction Phase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://code.iconify.design/3/3.1.1/iconify.min.js" />
      </head>
      <body>
        <Providers>
          <TopNavBar />
          <Sidebar />
          <main className="pt-16 min-h-screen flex flex-col">
            {children}
            <Footer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
