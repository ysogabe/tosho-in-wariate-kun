'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ログイン機能が実装されるまでは直接ダッシュボードに遷移するハンドラー
  const handleLogin = () => {
    setIsLoading(true);
    setError('');
    
    // 実際の認証ロジックの代わりに、タイマーでダッシュボードに遷移
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden mx-auto">
        {/* ヘッダー部分 */}
        <div className="bg-white p-6 pb-4">
          <h1 className="text-2xl font-bold text-center" style={{ color: 'hsl(340, 80%, 45%)', fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif', textShadow: '1px 1px 0 rgba(255, 255, 255, 0.8)' }}>
            図書当番割り当てくん
          </h1>
        </div>

        {/* 中央部分 - 黄色い背景の本アイコンとパスワードを忘れた場合 */}
        <div className="bg-amber-100 p-8 flex flex-col items-center space-y-6">
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
          
          <div className="w-full space-y-5">
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
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-center">
              <Link href="/forgot-password" className="text-slate-700 hover:underline text-sm">
                パスワードを忘れた場合
              </Link>
            </div>

            <button
              type="button"
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </div>

        {/* 下部 - 新規登録ボタン */}
        <div className="p-4 flex justify-center">
          <Link
            href="/register"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors text-center"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
