import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Leveler',
  description: 'A simple text input and display app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



