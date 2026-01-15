import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/common/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Agents - AI Assistant Platform',
  description: 'Multi-tenant ChatGPT-like application with MCP integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}