'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCalendarAlt, FaSpinner } from 'react-icons/fa';

export default function GenerateSchedulePage() {
  const [semester, setSemester] = useState('first'); // 前期・後期
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<null | { success: boolean, message: string }>(null);

  // スケジュールを生成
  const generateSchedule = () => {
    setIsGenerating(true);
    setGeneratedSchedule(null);

    // 実際のアプリケーションではAPIを呼び出してスケジュールを生成する
    // ここではシミュレーションとして3秒後に完了する
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSchedule({
        success: true,
        message: `${year}年度${semester === 'first' ? '前期' : '後期'}のスケジュールが正常に生成されました。`
      });
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ スケジュール生成 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <h2 className="text-2xl font-bold text-text mb-6">年度と学期を指定してスケジュールを生成</h2>
        <p className="text-text-light mb-6">
          スケジュールは年2回（前期・後期）の修正を行います。曜日単位で図書委員を割り当てます。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-text-light mb-2">年度</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}年度</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-light mb-2">学期</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="first">前期（4月〜9月）</option>
              <option value="second">後期（10月〜3月）</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className={`px-8 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                生成中...
              </>
            ) : (
              <>
                <FaCalendarAlt className="mr-2" />
                スケジュールを生成
              </>
            )}
          </button>
        </div>

        {generatedSchedule && (
          <div className={`mt-8 p-4 rounded-lg ${generatedSchedule.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <p className="font-medium">{generatedSchedule.message}</p>
            {generatedSchedule.success && (
              <div className="mt-4 flex justify-center">
                <Link
                  href="/management/validate-schedule"
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  生成されたスケジュールを確認
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary">
        <h2 className="text-xl font-bold text-text mb-4">スケジュール生成について</h2>
        <p className="text-text-light mb-3">
          このツールは設定されたルールに基づいて図書委員の当番スケジュールを自動生成します。
        </p>
        <p className="text-text-light mb-3">
          スケジュールは年2回（前期・後期）の修正を行い、曜日単位で図書委員を割り当てます。日付単位での割当は行いません。
        </p>
        <p className="text-text-light mb-3">
          生成前に以下の項目が設定されていることを確認してください：
        </p>
        <ul className="list-disc list-inside text-text-light space-y-2 mb-3">
          <li>図書委員の登録</li>
          <li>図書室情報の登録</li>
          <li>スケジュールルールの設定</li>
        </ul>
        <p className="text-text-light">
          生成されたスケジュールは「スケジュール検証」画面で確認し、必要に応じて手動で調整できます。
        </p>
      </div>
    </div>
  );
}
