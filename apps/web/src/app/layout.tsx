import React from 'react';
import type { Metadata } from 'next';
import '../styles/theme.css';

export const metadata: Metadata = {
  title: 'Ma Sói Online — Game Ma Sói Đấu Trí & Sinh Tồn',
  description: 'Trải nghiệm game Ma Sói realtime nhiều người chơi với kiến trúc Clean Architecture, phòng chat đa luồng và đồng bộ thời gian chuẩn xác.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
