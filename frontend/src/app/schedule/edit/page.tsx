'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 型定義
interface Duty {
  id: number;
  date: Date;
  room: string;
  time: string;
  members: string[];
  changeReason?: string;
}

interface CalendarCell {
  date: Date | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// 曜日の配列
const weekdays: string[] = ['日', '月', '火', '水', '木', '金', '土'];

// 現在の日付を取得
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

// モックデータ: 当番スケジュール
const mockDuties: Duty[] = [
  { id: 1, date: today, room: '図書室A', time: '12:30-13:00', members: ['山田太郎', '佐藤花子'] },
  { id: 2, date: today, room: '図書室A', time: '15:30-16:00', members: ['鈴木一郎', '高橋明'] },
  { id: 3, date: today, room: '図書室B', time: '12:30-13:00', members: ['渡辺健太', '中村さくら'] },
  { id: 4, date: nextWeek, room: '図書室A', time: '12:30-13:00', members: ['小林和也', '加藤美咲'] },
  { id: 5, date: nextWeek, room: '図書室B', time: '15:30-16:00', members: ['山田太郎', '鈴木一郎'] },
  { id: 6, date: nextWeek, room: '図書室A', time: '12:30-13:00', members: ['佐藤花子', '高橋明'] },
  { id: 7, date: nextWeek, room: '図書室B', time: '12:30-13:00', members: ['渡辺健太', '中村さくら'] },
  { id: 8, date: nextWeek, room: '図書室A', time: '15:30-16:00', members: ['小林和也', '加藤美咲'] },
  { id: 9, date: nextWeek, room: '図書室B', time: '12:30-13:00', members: ['山田太郎', '佐藤花子'] },
  { id: 10, date: nextWeek, room: '図書室A', time: '12:30-13:00', members: ['鈴木一郎', '高橋明'] },
];

// モックデータ - スケジュール一覧
const mockScheduleList = [
  { id: 1, name: '2025年度前期スケジュール', period: '2025/04/01 - 2025/09/30', isPublished: true },
  { id: 2, name: '2025年度後期スケジュール', period: '2025/10/01 - 2026/03/31', isPublished: false },
];

// モックデータ - 図書委員一覧
const mockMembers = [
  { id: 1, name: '山田 太郎', grade: '1年', className: 'A組' },
  { id: 2, name: '佐藤 花子', grade: '1年', className: 'B組' },
  { id: 3, name: '鈴木 一郎', grade: '2年', className: 'A組' },
  { id: 4, name: '高橋 さくら', grade: '2年', className: 'C組' },
  { id: 5, name: '伊藤 健太', grade: '3年', className: 'B組' },
  { id: 6, name: '渡辺 恵', grade: '3年', className: 'A組' },
  { id: 7, name: '中村 大輔', grade: '1年', className: 'C組' },
  { id: 8, name: '小林 由美', grade: '2年', className: 'B組' },
  { id: 9, name: '加藤 隆', grade: '3年', className: 'A組' },
  { id: 10, name: '吉田 優子', grade: '1年', className: 'B組' },
];

export default function ScheduleEdit() {
  const [selectedSchedule, setSelectedSchedule] = useState<number>(1);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2025, 4, 1)); // 2025年5月
  const [isPublished, setIsPublished] = useState<boolean>(mockScheduleList[0].isPublished);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDuty, setCurrentDuty] = useState<Duty | null>(null);
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [duties, setDuties] = useState<Duty[]>(mockDuties);

  // 現在の年月を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 月のカレンダー日数（前月の余り + 当月の日数）
  const daysInMonth = lastDayOfMonth.getDate();

  // 前月へ移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 翌月へ移動
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 日付をクリックしたときの処理
  const handleDateClick = (date: Date) => {
    // クリックした日付の当番を取得
    const dutiesForDate = duties.filter(duty => {
      return duty.date.toDateString() === date.toDateString();
    });
    
    if (dutiesForDate.length > 0) {
      // 既存の当番を編集
      const dutyToEdit = dutiesForDate[0];
      setCurrentDuty(dutyToEdit);
      setNewMembers([...dutyToEdit.members]);
      setChangeReason(dutyToEdit.changeReason || '');
    } else {
      // 新しい当番を作成
      const newDuty: Duty = {
        id: Date.now(),
        date: date,
        room: '図書室A',
        time: '12:30-13:00',
        members: [],
        changeReason: '新規作成',
      };
      setCurrentDuty(newDuty);
      setNewMembers([]);
      setChangeReason('新規作成');
    }
    setIsModalOpen(true);
  };



  // カレンダーセルを生成
  const generateCalendarCells = (): CalendarCell[] => {
    // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const cells: CalendarCell[] = [];
    
    // 前月の日付を追加
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i + 1);
      cells.push({
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // 当月の日付を追加
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.toDateString() === new Date().toDateString();
      cells.push({
        date,
        isCurrentMonth: true,
        isToday
      });
    }
    
    // 次月の日付を追加（6行目まで埋める）
    const remainingCells = 42 - cells.length; // 6行×7日
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      cells.push({
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return cells;
  };

  // 日付をフォーマットする関数
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 指定された日付のスケジュールを取得
  const getScheduleForDate = (date: Date | null): Duty[] | null => {
    if (!date) return null;
    const dutiesForDate = duties.filter(duty => {
      return duty.date.toDateString() === date.toDateString();
    });
    return dutiesForDate.length > 0 ? dutiesForDate : null;
  };

  // モーダルを開いて当番を編集
  const openEditModal = (duty: Duty, date: Date) => {
    setCurrentDuty(duty);
    setNewMembers([...duty.members]);
    setChangeReason('');
    setIsModalOpen(true);
    // 日付をセット
    setCurrentDate(date);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    // 少し遅らせて状態をリセット（アニメーションのため）
    setTimeout(() => {
      setCurrentDuty(null);
      setNewMembers([]);
      setChangeReason('');
    }, 300);
  };

  // 当番の変更を保存
  const saveDutyChanges = () => {
    if (!currentDuty) return;
    
    const updatedDuty: Duty = {
      ...currentDuty,
      members: [...newMembers],
      changeReason: changeReason || '変更なし'
    };
    
    // 既存の当番を更新または新規追加
    setDuties(prevDuties => {
      const existingIndex = prevDuties.findIndex(d => d.id === updatedDuty.id);
      if (existingIndex >= 0) {
        const newDuties = [...prevDuties];
        newDuties[existingIndex] = updatedDuty;
        return newDuties;
      } else {
        return [...prevDuties, updatedDuty];
      }
    });
    
    // モーダルを閉じる
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
                      setIsPublished(mockScheduleList.find(s => s.id === schedId)?.isPublished || false);
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

            {/* 月間カレンダー */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden mb-6">
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
                {generateCalendarCells().map((cell, index) => {
                  if (!cell.date) return <div key={index} className="min-h-32 bg-white p-2"></div>;
                  
                  const schedule = getScheduleForDate(cell.date);
                  const isToday = cell.date.toDateString() === new Date().toDateString();
                  const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
                  
                  return (
                    <div 
                      key={index} 
                      className={`min-h-32 bg-white p-2 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleDateClick(cell.date as Date)}
                    >
                      <div className={`text-right font-medium ${
                        cell.date.getDay() === 0 ? 'text-red-500' : 
                        cell.date.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'
                      }`}>
                        {cell.date.getDate()}
                      </div>
                      <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                        {schedule ? (
                          <div className="space-y-1">
                            {schedule.map((item) => (
                              <div 
                                key={item.id} 
                                className="p-1 bg-blue-50 border-l-4 border-blue-500 text-xs cursor-pointer hover:bg-blue-100"
                                onClick={() => openEditModal(item, cell.date as Date)}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center">
          <p> 2025 図書当番割り当てくん</p>
        </div>
      </footer>

      {/* 当番編集モーダル */}
      {isModalOpen && currentDuty && currentDuty.date && (
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
                      const selectedValues: string[] = [];
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

                <div className="mb-4">
                  <label htmlFor="changeReason" className="block text-sm font-medium text-gray-700 mb-1">
                    変更理由（任意）
                  </label>
                  <textarea
                    id="changeReason"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="変更理由を入力してください（任意）"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={saveDutyChanges}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
