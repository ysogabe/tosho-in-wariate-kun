'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 曜日の配列
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

// モックデータ - 当番スケジュール
const mockSchedules = {
  '2025-05-01': [
    { room: '図書室A', time: '12:30-13:00', members: ['山田太郎', '佐藤花子'] },
  ],
  '2025-05-02': [
    { room: '図書室A', time: '12:30-13:00', members: ['鈴木一郎', '高橋明'] },
  ],
  '2025-05-05': [
    { room: '図書室B', time: '15:30-16:00', members: ['渡辺健太', '中村さくら'] },
  ],
  '2025-05-08': [
    { room: '図書室A', time: '12:30-13:00', members: ['小林和也', '加藤美咲'] },
  ],
  '2025-05-12': [
    { room: '図書室B', time: '15:30-16:00', members: ['山田太郎', '高橋明'] },
  ],
  '2025-05-15': [
    { room: '図書室A', time: '12:30-13:00', members: ['佐藤花子', '渡辺健太'] },
  ],
  '2025-05-19': [
    { room: '図書室B', time: '15:30-16:00', members: ['鈴木一郎', '中村さくら'] },
  ],
  '2025-05-22': [
    { room: '図書室A', time: '12:30-13:00', members: ['小林和也', '山田太郎'] },
    { room: '図書室B', time: '15:30-16:00', members: ['加藤美咲', '高橋明'] },
  ],
  '2025-05-26': [
    { room: '図書室A', time: '12:30-13:00', members: ['佐藤花子', '鈴木一郎'] },
  ],
  '2025-05-29': [
    { room: '図書室B', time: '15:30-16:00', members: ['渡辺健太', '小林和也'] },
  ],
};

// モックデータ - スケジュール一覧
const mockScheduleList = [
  { id: 1, name: '2025年度前期スケジュール', period: '2025/04/01 - 2025/09/30' },
  { id: 2, name: '2025年度後期スケジュール', period: '2025/10/01 - 2026/03/31' },
];

export default function ScheduleView() {
  const [selectedSchedule, setSelectedSchedule] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // 2025年5月

  // 現在の年月を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 月のカレンダー日数（前月の余り + 当月の日数）
  const daysInMonth = lastDayOfMonth.getDate();

  // カレンダーの日付を生成
  const calendarDays = [];
  
  // 前月の余白を追加
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // 当月の日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // 前月へ移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 翌月へ移動
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 日付フォーマット関数
  const formatDate = (date: Date | null): string => {
    return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
  };

  // 指定された日付のスケジュールを取得
  const getScheduleForDate = (date: Date | null): { room: string; time: string; members: string[] }[] => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return mockSchedules[dateStr as keyof typeof mockSchedules] || [];
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 relative mr-2">
              <Image 
                src="/images/books-icon.png" 
                alt="本のアイコン"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800">図書当番割り当てくん</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">管理者さん</span>
            <Link href="/dashboard">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors">
                ダッシュボードへ戻る
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-grow bg-gray-50 p-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">スケジュール表示</h2>

          {/* フィルターと表示切替 */}
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="scheduleSelect" className="block text-sm font-medium text-gray-700 mb-1">スケジュール</label>
                  <select
                    id="scheduleSelect"
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(Number(e.target.value))}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {mockScheduleList.map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.name} ({schedule.period})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    ◀ 前月
                  </button>
                  <span className="font-medium">
                    {year}年{month + 1}月
                  </span>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    翌月 ▶
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href="/schedule/edit">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                    スケジュール編集
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* 月間カレンダー */}
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {weekdays.map((day, index) => (
                <div 
                  key={index} 
                  className={`p-2 text-center font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map((date, index) => {
                const schedule = getScheduleForDate(date);
                const isToday = date && new Date().toDateString() === date.toDateString();
                const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-32 bg-white p-2 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-right font-medium ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                        <div className="mt-1">
                          {schedule ? (
                            <div className="space-y-1">
                              {schedule.map((item: { room: string; time: string; members: string[] }, idx: number) => (
                                <div key={idx} className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm">
                                  <div className="font-medium">{item.room}</div>
                                  <div className="text-gray-600">{item.time}</div>
                                  <div className="text-gray-700 mt-1">
                                    <span className="font-medium">担当者: </span>
                                    {item.members.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : isWeekend ? (
                            <div className="text-xs text-gray-400 italic">休日</div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 凡例 */}
          <div className="mt-6 bg-white p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">凡例</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 border-l-4 border-blue-500 mr-2"></div>
                <span className="text-sm">当番割り当て</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 ring-2 ring-blue-500 mr-2"></div>
                <span className="text-sm">今日</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center">
          <p>© 2025 図書当番割り当てくん</p>
        </div>
      </footer>
    </div>
  );
}
