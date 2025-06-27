'use client'

import { useEffect, useState } from 'react'
import { testDatabaseConnection } from '@/lib/database/test'

export default function TestDbPage() {
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const test = async () => {
      const result = await testDatabaseConnection()
      setConnectionStatus(result)
      setLoading(false)
    }
    test()
  }, [])

  if (loading) return <div>Testing connection...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <div
        className={`p-4 rounded ${
          connectionStatus ? 'bg-green-100' : 'bg-red-100'
        }`}
      >
        {connectionStatus ? '✅ SQLite接続成功' : '❌ SQLite接続失敗'}
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">認証テスト</h2>
        <p>
          NextAuth.js設定: <code>/api/auth/[...nextauth]</code>
        </p>
        <p>
          ログインページ: <code>/auth/signin</code>
        </p>
        <p>
          サインアップページ: <code>/auth/signup</code>
        </p>
      </div>
    </div>
  )
}
