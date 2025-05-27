'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface AssignmentMember {
  id: number;
  name: string;
  class_name?: string;
  grade_name?: string;
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

interface ScheduleDetails {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  assignments: BackendScheduleAssignment[];
}

interface LibrarySchedule {
  libraryId: number;
  libraryName: string;
  weekSchedule: {
    [dayOfWeek: number]: AssignmentMember[];
  };
}

interface ScheduleWeeklyViewProps {
  scheduleId: number | null;
  className?: string;
  showEmpty?: boolean;
}

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
        const scheduleDetails = await api.schedules.getById(scheduleId) as unknown as ScheduleDetails;
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

  // 図書室別に週間スケジュールを整理
  const getLibrarySchedules = (): LibrarySchedule[] => {
    const libraryMap = new Map<number, LibrarySchedule>();
    
    assignments.forEach(assignment => {
      if (!libraryMap.has(assignment.library_id)) {
        libraryMap.set(assignment.library_id, {
          libraryId: assignment.library_id,
          libraryName: assignment.library_name,
          weekSchedule: {}
        });
      }
      
      const library = libraryMap.get(assignment.library_id)!;
      if (!library.weekSchedule[assignment.day_of_week]) {
        library.weekSchedule[assignment.day_of_week] = [];
      }
      
      // 割り当てられたメンバーを追加
      if (assignment.assigned_committee_members && assignment.assigned_committee_members.length > 0) {
        library.weekSchedule[assignment.day_of_week].push(...assignment.assigned_committee_members);
      } else if (assignment.committee_member_id && assignment.committee_member_name) {
        library.weekSchedule[assignment.day_of_week].push({
          id: assignment.committee_member_id,
          name: assignment.committee_member_name
        });
      }
    });
    
    return Array.from(libraryMap.values()).sort((a, b) => a.libraryName.localeCompare(b.libraryName));
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

  const librarySchedules = getLibrarySchedules();
  
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                図書室
              </th>
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
            {librarySchedules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  スケジュールデータがありません
                </td>
              </tr>
            ) : (
              librarySchedules.map((library) => (
                <tr key={library.libraryId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {library.libraryName}
                  </td>
                  {weekdays.map((dayOfWeek) => {
                    const members = library.weekSchedule[dayOfWeek] || [];
                    return (
                      <td
                        key={dayOfWeek}
                        className="px-4 py-4 text-sm text-gray-500 border-l"
                      >
                        {members.length === 0 ? (
                          <div className="text-center text-gray-400">
                            -
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {members.map((member, index) => {
                              const displayClass = member.grade_name && member.class_name 
                                ? `${member.grade_name}${member.class_name}` 
                                : '';
                              return (
                                <div
                                  key={`${member.id}-${index}`}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1"
                                >
                                  {displayClass && (
                                    <span className="text-[10px] mr-1">
                                      {displayClass}
                                    </span>
                                  )}
                                  <span>{member.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}