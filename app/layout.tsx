import type { Metadata } from 'next'
import './globals.css'
import './lightbox.css'

export const metadata: Metadata = {
  title: 'YachtGenius - AI Interior Redesign',
  description: 'Redesign your yacht interior with AI-powered style generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
