'use client'

import Link from 'next/link'

export default function BackButton() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
    >
      ← 返回首页
    </Link>
  )
}
