'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 曜日の配列
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

// モックデータ - 当番スケジュール
const mockSchedules = {
  '2025-05-01': [
    { id: 1, room: '図書室A', time: '12:30-13:00', members: ['山田太郎', '佐藤花子'] },
  ],
  '2025-05-02': [
    { id: 2, room: '図書室A', time: '12:30-13:00', members: ['鈴木一郎', '高橋明'] },
  ],
  '2025-05-05': [
    { id: 3, room: '図書室B', time: '15:30-16:00', members: ['渡辺健太', '中村さくら'] },
  ],
  '2025-05-08': [
    { id: 4, room: '図書室A', time: '12:30-13:00', members: ['小林和也', '加藤美咲'] },
  ],
  '2025-05-12': [
    { id: 5, room: '図書室B', time: '15:30-16:00', members: ['山田太郎', '高橋明'] },
  ],
  '2025-05-15': [
    { id: 6, room: '図書室A', time: '12:30-13:00', members: ['佐藤花子', '渡辺健太'] },
  ],
  '2025-05-19': [
    { id: 7, room: '図書室B', time: '15:30-16:00', members: ['鈴木一郎', '中村さくら'] },
  ],
  '2025-05-22': [
    { id: 8, room: '図書室A', time: '12:30-13:00', members: ['小林和也', '山田太郎'] },
    { id: 9, room: '図書室B', time: '15:30-16:00', members: ['加藤美咲', '高橋明'] },
  ],
  '2025-05-26': [
    { id: 10, room: '図書室A', time: '12:30-13:00', members: ['佐藤花子', '鈴木一郎'] },
  ],
  '2025-05-29': [
    { id: 11, room: '図書室B', time: '15:30-16:00', members: ['渡辺健太', '小林和也'] },
  ],
};

// モックデータ - スケジュール一覧
const mockScheduleList = [
  { id: 1, name: '2025年度前期スケジュール', period: '2025/04/01 - 2025/09/30', isPublished: true },
  { id: 2, name: '2025年度後期スケジュール', period: '2025/10/01 - 2026/03/31', isPublished: false },
];

// モックデータ - 図書委員一覧
const mockMembers = [
  { id: 1, name: '山田太郎', grade: '1年', className: 'A組' },
  { id: 2, name: '佐藤花子', grade: '1年', className: 'B組' },
  { id: 3, name: '鈴木一郎', grade: '2年', className: 'A組' },
  { id: 4, name: '高橋明', grade: '2年', className: 'C組' },
  { id: 5, name: '渡辺健太', grade: '3年', className: 'B組' },
  { id: 6, name: '中村さくら', grade: '3年', className: 'A組' },
  { id: 7, name: '小林和也', grade: '1年', className: 'C組' },
  { id: 8, name: '加藤美咲', grade: '2年', className: 'B組' },
];

export default function ScheduleEdit() {
  const [selectedSchedule, setSelectedSchedule] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // 2025年5月
  const [isPublished, setIsPublished] = useState(mockScheduleList[0].isPublished);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [newMembers, setNewMembers] = useState([]);
  const [changeReason, setChangeReason] = useState('');

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
  const formatDate = (date) => {
    return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
  };

  // 日付のスケジュールを取得
  const getScheduleForDate = (date) => {
    if (!date) return null;
    const dateString = formatDate(date);
    return mockSchedules[dateString] || null;
  };

  // 当番編集モーダルを開く
  const openEditModal = (duty, date) => {
    setCurrentDuty({
      ...duty,
      date: date
    });
    setNewMembers(duty.members);
    setChangeReason('');
    setIsModalOpen(true);
  };

  // 当番編集モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDuty(null);
    setNewMembers([]);
    setChangeReason('');
  };

  // 当番の変更を保存
  const saveDutyChanges = () => {
    // 実際のアプリケーションでは、ここでAPIを呼び出してデータを更新します
    // このモックでは、変更を表示するだけです
    alert(`当番変更を保存しました。\n日付: ${formatDate(currentDuty.date)}\n図書室: ${currentDuty.room}\n担当者: ${newMembers.join(', ')}\n変更理由: ${changeReason || 'なし'}`);
    closeModal();
  };

  // 公開状態を切り替える
  const togglePublishStatus = () => {
    setIsPublished(!isPublished);
    // 実際のアプリケーションでは、ここでAPIを呼び出して公開状態を更新します
    alert(`スケジュールを${!isPublished ? '公開' : '非公開'}に設定しました。`);
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">スケジュール編集</h2>

          {/* フィルターと表示切替 */}
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="scheduleSelect" className="block text-sm font-medium text-gray-700 mb-1">スケジュール</label>
                  <select
                    id="scheduleSelect"
                    value={selectedSchedule}
                    onChange={(e) => {
                      const schedId = Number(e.target.value);
                      setSelectedSchedule(schedId);
                      setIsPublished(mockScheduleList.find(s => s.id === schedId).isPublished);
                    }}
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">公開状態:</span>
                  <button
                    onClick={togglePublishStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${isPublished ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPublished ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                  <span className="ml-2 text-sm text-gray-700">
                    {isPublished ? '公開中' : '非公開'}
                  </span>
                </div>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                  検証
                </button>
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
                              {schedule.map((item) => (
                                <div 
                                  key={item.id} 
                                  className="p-1 bg-blue-50 border-l-4 border-blue-500 text-xs cursor-pointer hover:bg-blue-100"
                                  onClick={() => openEditModal(item, date)}
                                >
                                  <div className="font-medium">{item.room}</div>
                                  <div>{item.time}</div>
                                  <div className="truncate">{item.members.join(', ')}</div>
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">操作方法</h3>
            <div className="text-sm text-gray-700">
              <p>当番をクリックすると、担当者を変更できます。変更後は検証ボタンを押して、ルール違反がないか確認してください。</p>
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

      {/* 当番編集モーダル */}
      {isModalOpen && currentDuty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                当番編集
              </h3>
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">日付</p>
                    <p className="text-sm text-gray-900">{formatDate(currentDuty.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">時間</p>
                    <p className="text-sm text-gray-900">{currentDuty.time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">場所</p>
                    <p className="text-sm text-gray-900">{currentDuty.room}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">現在の担当者</p>
                  <div className="p-2 bg-gray-100 rounded-md text-sm">
                    {currentDuty.members.join(', ')}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="newMembers" className="block text-sm font-medium text-gray-700 mb-1">新しい担当者</label>
                  <select
                    id="newMembers"
                    multiple
                    value={newMembers}
                    onChange={(e) => {
                      const options = e.target.options;
                      const selectedValues = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) {
                          selectedValues.push(options[i].value);
                        }
                      }
                      setNewMembers(selectedValues);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    size={5}
                  >
                    {mockMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.grade} {member.className})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ctrlキーを押しながら複数選択できます</p>
                </div>

                <div>
                  <label htmlFor="changeReason" className="block text-sm font-medium text-gray-700 mb-1">変更理由</label>
                  <textarea
                    id="changeReason"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="変更理由を入力してください"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveDutyChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
