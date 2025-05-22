'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 登録機能が実装されるまでは直接ログイン画面に遷移するハンドラー
  const handleRegister = () => {
    // バリデーション
    if (!name) {
      setError('氏名を入力してください');
      return;
    }
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    if (!password) {
      setError('パスワードを入力してください');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードと確認用パスワードが一致しません');
      return;
    }
    if (!agreeTerms) {
      setError('利用規約に同意してください');
      return;
    }

    // 登録処理（モック）
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー - タイトル */}
      <header className="bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800">新規ユーザー登録</h1>
      </header>

      {/* 中央部分 - 黄色い背景の本アイコンと登録フォーム */}
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
        
        <div className="w-full space-y-5">
          <div className="space-y-2">
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="氏名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="パスワード（8文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="パスワード（確認用）"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-700">
              利用規約に同意します
            </label>
          </div>

          <button
            type="button"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? '登録中...' : '登録する'}
          </button>
        </div>
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
