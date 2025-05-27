'use client';

import { useState, useEffect } from 'react';

interface AssignmentMember {
  id: number;
  name: string;
}

interface BackendScheduleAssignment {
  id: number;
  schedule_id: number;
  library_id: number;
  library_name: string;
  day_of_week: number; // 1=Monday, 2=Tuesday, etc.
  date: string; // Day name from backend (e.g., "Monday")
  time_slot: string;
  committee_member_id?: number | null;
  committee_member_name?: string | null;
  assigned_committee_members: AssignmentMember[];
}

interface ScheduleWeeklyViewProps {
  scheduleId: number | null;
  className?: string;
  showEmpty?: boolean;
}

const API_BASE_URL = 'http://localhost:5100/api';

export default function ScheduleWeeklyView({ scheduleId, className = '', showEmpty = true }: ScheduleWeeklyViewProps) {
  const [assignments, setAssignments] = useState<BackendScheduleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 曜日の配列
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday

  useEffect(() => {
    if (!scheduleId) {
      setAssignments([]);
      return;
    }

    const fetchAssignments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`);
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        
        const scheduleDetails = await response.json();
        setAssignments(scheduleDetails.assignments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '割り当ての取得に失敗しました。');
        console.error(err);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [scheduleId]);

  // 曜日別に割り当てを整理
  const getAssignmentsForDay = (dayOfWeek: number) => {
    return assignments.filter(assignment => assignment.day_of_week === dayOfWeek);
  };

  if (isLoading) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="text-center text-red-500">エラー: {error}</div>
      </div>
    );
  }

  if (!scheduleId && showEmpty) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">スケジュールを選択してください</div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {weekdays.map((dayOfWeek) => (
                <th
                  key={dayOfWeek}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {daysOfWeek[dayOfWeek]}曜日
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              {weekdays.map((dayOfWeek) => {
                const dayAssignments = getAssignmentsForDay(dayOfWeek);
                return (
                  <td
                    key={dayOfWeek}
                    className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 border-r last:border-r-0 align-top"
                  >
                    {dayAssignments.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-gray-400">
                        当番なし
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="p-2 bg-blue-50 border border-blue-200 rounded-md"
                          >
                            <div className="font-medium text-blue-800">
                              {assignment.time_slot || '終日'}
                            </div>
                            <div className="text-gray-700 text-xs">
                              {assignment.library_name}
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {assignment.assigned_committee_members?.map(member => member.name).join(', ') || 
                               assignment.committee_member_name || 
                               'メンバー未定'}
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
    </div>
  );
}