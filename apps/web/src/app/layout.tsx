import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Multi-Domain Sales & Commerce Platform',
  description: 'Enterprise B2B2C Commercial Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-zinc-950 antialiased selection:bg-zinc-900 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
