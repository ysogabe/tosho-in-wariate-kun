'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ScheduleAssignment {
  id: number;
  date: string;
  day: string;
  timeSlot: string;
  library: string;
  members: string[];
}

export default function WeeklySchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [scheduleAssignments, setScheduleAssignments] = useState<ScheduleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules] = useState<{id: number, name: string}[]>([
    { id: 1, name: '2025年度前期スケジュール' },
    { id: 2, name: '2025年度後期スケジュール' },
  ]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>(1);

  // 曜日の配列
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  // 現在の週の日付を計算
  const calculateWeekDates = (startDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    // 週の開始日（月曜日）に調整
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    currentDate.setDate(diff);
    
    // 月曜日から日曜日までの7日間
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // 日付をフォーマット
  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 前の週へ
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  // 次の週へ
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // 今週へ
  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  // スケジュールを変更
  const changeSchedule = (scheduleId: number) => {
    setSelectedScheduleId(scheduleId);
  };

  // スケジュールデータを取得
  useEffect(() => {
    setIsLoading(true);
    
    // 実際のアプリではAPIからデータを取得する
    // ここではモックデータを使用
    setTimeout(() => {
      const weekDates = calculateWeekDates(currentWeekStart);
      
      const mockAssignments: ScheduleAssignment[] = [
        {
          id: 1,
          date: '2025/4/7',
          day: '月',
          timeSlot: '12:30-13:00',
          library: '図書室A',
          members: ['山田太郎', '佐藤花子']
        },
        {
          id: 2,
          date: '2025/4/7',
          day: '月',
          timeSlot: '15:30-16:00',
          library: '図書室A',
          members: ['鈴木一郎', '高橋明']
        },
        {
          id: 3,
          date: '2025/4/8',
          day: '火',
          timeSlot: '12:30-13:00',
          library: '図書室A',
          members: ['渡辺健太', '中村さくら']
        },
        {
          id: 4,
          date: '2025/4/10',
          day: '木',
          timeSlot: '12:30-13:00',
          library: '図書室A',
          members: ['小林和也', '加藤美咲']
        },
        {
          id: 5,
          date: '2025/4/10',
          day: '木',
          timeSlot: '15:30-16:00',
          library: '図書室A',
          members: ['山田太郎', '鈴木一郎']
        },
        {
          id: 6,
          date: '2025/4/11',
          day: '金',
          timeSlot: '12:30-13:00',
          library: '図書室A',
          members: ['佐藤花子', '高橋明']
        },
      ];
      
      // 表示する週に合わせてフィルタリング
      const filteredAssignments = mockAssignments.filter(assignment => {
        const assignmentDate = new Date(assignment.date.replace(/\//g, '-'));
        return weekDates.some(date => 
          date.getFullYear() === assignmentDate.getFullYear() &&
          date.getMonth() === assignmentDate.getMonth() &&
          date.getDate() === assignmentDate.getDate()
        );
      });
      
      setScheduleAssignments(filteredAssignments);
      setIsLoading(false);
    }, 500);
  }, [currentWeekStart, selectedScheduleId]);

  // 週の日付を計算
  const weekDates = calculateWeekDates(currentWeekStart);

  // 特定の日付の当番を取得
  const getAssignmentsForDate = (date: Date) => {
    const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    return scheduleAssignments.filter(assignment => {
      const [year, month, day] = assignment.date.split('/');
      return `${year}/${month}/${day}` === formattedDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Image 
              src="/images/books-icon.png" 
              alt="本のアイコン" 
              width={32} 
              height={32} 
              className="h-8 w-8 mr-2"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900">図書当番割り当てくん</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4">管理者さん</span>
            <Link href="/dashboard">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors">
                ダッシュボードへ戻る
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">週間スケジュール</h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="mb-4 sm:mb-0">
                  <label htmlFor="schedule-select" className="block text-sm font-medium text-gray-700 mb-1">
                    スケジュール選択
                  </label>
                  <select
                    id="schedule-select"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedScheduleId}
                    onChange={(e) => changeSchedule(parseInt(e.target.value))}
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousWeek}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md font-medium transition-colors"
                  >
                    前週
                  </button>
                  <button
                    onClick={goToCurrentWeek}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium transition-colors"
                  >
                    今週
                  </button>
                  <button
                    onClick={goToNextWeek}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md font-medium transition-colors"
                  >
                    次週
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {weekDates.map((date, index) => (
                          <th
                            key={index}
                            className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
                            }`}
                          >
                            <div>{daysOfWeek[date.getDay()]}</div>
                            <div className="text-sm font-bold text-gray-900">{formatDate(date)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        {weekDates.map((date, index) => {
                          const assignments = getAssignmentsForDate(date);
                          return (
                            <td key={index} className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0">
                              {assignments.length === 0 ? (
                                <div className="h-24 flex items-center justify-center text-gray-400">
                                  当番なし
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {assignments.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className="p-2 bg-blue-50 border border-blue-200 rounded-md"
                                    >
                                      <div className="font-medium text-blue-800">{assignment.timeSlot}</div>
                                      <div className="text-gray-700">{assignment.library}</div>
                                      <div className="mt-1 text-xs text-gray-600">
                                        {assignment.members.join(', ')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Link href="/schedule/edit">
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                    スケジュール編集
                  </button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">凡例</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-700">当番あり</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded-sm mr-2"></div>
                  <span className="text-sm text-gray-700">当番なし</span>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  ※ スケジュールは管理者によって変更される場合があります。最新の情報を確認してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white shadow mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">© 2025 図書当番割り当てくん</p>
        </div>
      </footer>
    </div>
  );
}
