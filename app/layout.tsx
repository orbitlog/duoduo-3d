import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D Learning Project',
  description: 'A learning project for Three.js and performance optimization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
