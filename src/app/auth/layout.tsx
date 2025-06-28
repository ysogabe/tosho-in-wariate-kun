import { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '図書委員当番システム',
    template: '%s | 図書委員当番システム',
  },
  description: '小学校図書委員の当番割り当てを自動化するシステム',
  robots: 'noindex, nofollow',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={inter.className}>{children}</div>
}
