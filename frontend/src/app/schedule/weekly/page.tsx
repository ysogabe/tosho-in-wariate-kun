'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Schedule {
  id: number;
  name: string;
  description?: string; // Optional as per backend
  start_date: string;
  end_date: string;
}

interface AssignmentMember {
  id: number;
  name: string;
}
interface BackendScheduleAssignment {
  id: number;
  schedule_id: number;
  library_id: number;
  library_name: string;
  date: string; // YYYY-MM-DD from backend
  time_slot: string;
  committee_member_id?: number | null; // If direct assignment
  committee_member_name?: string | null; // If direct assignment
  assigned_committee_members: AssignmentMember[]; // Updated to use this for members list
}

// Frontend representation, might be slightly different or augmented
interface ScheduleAssignment {
  id: number;
  date: string; // Keep as YYYY-MM-DD for filtering
  day: string; // Derived on frontend for display
  timeSlot: string;
  library: string; // Corresponds to library_name
  members: AssignmentMember[]; // Updated
}


const API_BASE_URL = 'http://localhost:5001/api';

export default function WeeklySchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [allScheduleAssignments, setAllScheduleAssignments] = useState<BackendScheduleAssignment[]>([]);
  const [filteredAssignmentsForWeek, setFilteredAssignmentsForWeek] = useState<ScheduleAssignment[]>([]);
  
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false); // Initially false until a schedule is selected
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  
  const [errorSchedules, setErrorSchedules] = useState<string | null>(null);
  const [errorAssignments, setErrorAssignments] = useState<string | null>(null);


  // 曜日の配列
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  // YYYY-MM-DD formatter
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 現在の週の日付を計算 (月曜日始まり)
  const calculateWeekDates = (startDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    currentDate.setDate(diff);
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // 日付を M/D 形式でフォーマット (表示用)
  const formatDisplayDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 週のナビゲーション
  const goToPreviousWeek = () => setCurrentWeekStart(prev => new Date(prev.setDate(prev.getDate() - 7)));
  const goToNextWeek = () => setCurrentWeekStart(prev => new Date(prev.setDate(prev.getDate() + 7)));
  const goToCurrentWeek = () => setCurrentWeekStart(new Date());

  // スケジュール選択の変更
  const handleScheduleChange = (scheduleId: string) => {
    setSelectedScheduleId(Number(scheduleId));
    setErrorAssignments(null); // Clear previous assignment errors
  };

  // Fetch schedules list on mount
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      setErrorSchedules(null);
      try {
        const response = await fetch(`${API_BASE_URL}/schedules`);
        if (!response.ok) throw new Error(`API Error (Schedules): ${response.status} ${response.statusText}`);
        const data: Schedule[] = await response.json();
        setSchedules(data);
        if (data.length > 0 && selectedScheduleId === null) {
          setSelectedScheduleId(data[0].id); // Default to first schedule
        }
      } catch (err) {
        setErrorSchedules(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました。');
        console.error(err);
      } finally {
        setIsLoadingSchedules(false);
      }
    };
    fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  // Fetch assignments for the selected schedule
  useEffect(() => {
    if (!selectedScheduleId) {
      setAllScheduleAssignments([]); // Clear assignments if no schedule is selected
      return;
    }

    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      setErrorAssignments(null);
      try {
        // Using GET /api/schedules/<schedule_id> which returns the schedule object with an 'assignments' array
        const response = await fetch(`${API_BASE_URL}/schedules/${selectedScheduleId}`);
        if (!response.ok) throw new Error(`API Error (Assignments): ${response.status} ${response.statusText}`);
        const scheduleDetails: Schedule & { assignments: BackendScheduleAssignment[] } = await response.json();
        
        // The backend returns 'assigned_committee_members' for the members list
        setAllScheduleAssignments(scheduleDetails.assignments || []);
      } catch (err) {
        setErrorAssignments(err instanceof Error ? err.message : '割り当ての取得に失敗しました。');
        console.error(err);
        setAllScheduleAssignments([]); // Clear on error
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [selectedScheduleId]);


  // Filter assignments for the current week view
  useEffect(() => {
    const weekDatesObjects = calculateWeekDates(currentWeekStart);
    const weekDateStrings = weekDatesObjects.map(date => formatDateToYYYYMMDD(date));

    const newFilteredAssignments = allScheduleAssignments
      .filter(assignment => weekDateStrings.includes(assignment.date))
      .map(backendAssignment => {
        const assignmentDate = new Date(backendAssignment.date + 'T00:00:00'); // Ensure local time interpretation
        return {
          id: backendAssignment.id,
          date: backendAssignment.date, // YYYY-MM-DD
          day: daysOfWeek[assignmentDate.getDay()], // Derive day of week
          timeSlot: backendAssignment.time_slot,
          library: backendAssignment.library_name,
          members: backendAssignment.assigned_committee_members || [], // Use assigned_committee_members
        };
      });
    setFilteredAssignmentsForWeek(newFilteredAssignments);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart, allScheduleAssignments]);
  

  const weekDates = calculateWeekDates(currentWeekStart);

  const getAssignmentsForDate = (date: Date): ScheduleAssignment[] => {
    const targetDateStr = formatDateToYYYYMMDD(date);
    return filteredAssignmentsForWeek.filter(assignment => assignment.date === targetDateStr);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src="/images/books-icon.png" alt="本のアイコン" className="h-8 w-8 mr-2" />
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
                  {isLoadingSchedules ? (
                    <p className="text-gray-500">スケジュールを読み込み中...</p>
                  ) : errorSchedules ? (
                     <p className="text-red-500">エラー: {errorSchedules}</p>
                  ) : schedules.length === 0 ? (
                    <p className="text-gray-500">利用可能なスケジュールがありません。</p>
                  ) : (
                    <select
                      id="schedule-select"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={selectedScheduleId ?? ''}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                      disabled={schedules.length === 0}
                    >
                      {schedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousWeek}
                    disabled={isLoadingAssignments}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    前週
                  </button>
                  <button
                    onClick={goToCurrentWeek}
                    disabled={isLoadingAssignments}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    今週
                  </button>
                  <button
                    onClick={goToNextWeek}
                    disabled={isLoadingAssignments}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    次週
                  </button>
                </div>
              </div>
              
              {isLoadingAssignments && <div className="text-center py-10">割り当てを読み込み中...</div>}
              {errorAssignments && <div className="text-center py-10 text-red-500">エラー: {errorAssignments}</div>}
              
              {!isLoadingAssignments && !errorAssignments && selectedScheduleId && (
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
                            <div className="text-sm font-bold text-gray-900">{formatDisplayDate(date)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        {weekDates.map((date, index) => {
                          const assignmentsOnDate = getAssignmentsForDate(date);
                          return (
                            <td key={index} className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0 align-top">
                              {assignmentsOnDate.length === 0 ? (
                                <div className="h-24 flex items-center justify-center text-gray-400">
                                  当番なし
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {assignmentsOnDate.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className="p-2 bg-blue-50 border border-blue-200 rounded-md"
                                    >
                                      <div className="font-medium text-blue-800">{assignment.timeSlot}</div>
                                      <div className="text-gray-700">{assignment.library}</div>
                                      <div className="mt-1 text-xs text-gray-600">
                                        {assignment.members.map(mem => mem.name).join(', ') || 'メンバー未定'}
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
              {!selectedScheduleId && !isLoadingSchedules && !errorSchedules &&
                <div className="text-center py-10 text-gray-500">スケジュールを選択してください。</div>
              }
              
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
