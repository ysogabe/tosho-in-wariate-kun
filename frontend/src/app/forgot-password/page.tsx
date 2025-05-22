'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // パスワードリセット機能が実装されるまでのモック処理
  const handleResetPassword = () => {
    // バリデーション
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    // メール送信処理（モック）
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー - タイトル */}
      <header className="bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800">パスワードリセット</h1>
      </header>

      {/* 中央部分 - 黄色い背景の本アイコンとフォーム */}
      <div className="bg-amber-100 p-8 flex flex-col items-center space-y-6 flex-grow">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 relative">
            <Image 
              src="/images/books-icon.png" 
              alt="本のアイコン"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {error && (
          <div className="w-full p-3 bg-red-50 text-red-600 rounded-md text-sm border-l-4 border-red-500">
            {error}
          </div>
        )}

        {success ? (
          <div className="w-full p-4 bg-green-50 text-green-700 rounded-md border-l-4 border-green-500">
            <p className="font-medium">パスワードリセットメールを送信しました</p>
            <p className="text-sm mt-1">メールに記載されたリンクからパスワードの再設定を行ってください。</p>
          </div>
        ) : (
          <div className="w-full space-y-5">
            <div>
              <p className="text-gray-700 mb-4">
                登録したメールアドレスを入力してください。パスワードリセット用のリンクをメールで送信します。
              </p>
            </div>
            
            <div className="space-y-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isLoading || success}
              />
            </div>

            <button
              type="button"
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              onClick={handleResetPassword}
              disabled={isLoading || success}
            >
              {isLoading ? '送信中...' : 'リセットリンクを送信'}
            </button>
          </div>
        )}
      </div>

      {/* 下部 - ログインページへのリンク */}
      <div className="p-4 flex justify-center">
        <Link href="/login" className="text-blue-600 hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </div>
  );
}
