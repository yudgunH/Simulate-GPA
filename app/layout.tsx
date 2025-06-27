import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Analytics } from "@vercel/analytics/next"
import './globals.css'

export const metadata: Metadata = {
  title: 'Simulate GPA - Tính toán GPA và mô phỏng kết quả học tập',
  description: 'Ứng dụng giúp sinh viên tính GPA, mô phỏng các tình huống học tập và đưa ra gợi ý để đạt mục tiêu học bổng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
} 