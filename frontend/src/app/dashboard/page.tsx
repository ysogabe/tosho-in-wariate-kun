'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import PageLayout from '../_components/PageLayout';
import TodayDuties from '../_components/TodayDuties';
import WeeklySchedule from '../_components/WeeklySchedule';
import { Card } from '@/components/ui/card';

interface Member {
  name: string;
  icon: string;
  className: string;
}

interface Duty {
  location: string;
  members: Member[];
}

interface DaySchedule {
  day: string;
  duties: Duty[];
}

interface Library {
  id: number;
  name: string;
  location?: string;
  capacity?: number;
  is_active: boolean;
}

const DashboardPage = () => {
  const [userName] = useState('管理者');
  const { schoolName } = useSchool(); // SchoolContextから学校名を取得
  const [currentDay, setCurrentDay] = useState<string>('');
  
  // 週間スケジュール情報 - APIから取得
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [hasSchedule, setHasSchedule] = useState(true); // スケジュールが存在するかどうか

  // APIからスケジュールを取得する関数
  const fetchWeeklySchedule = async () => {
    setIsLoading(true);
    setScheduleError(null);
    try {
      const response = await fetch('http://localhost:5012/api/schedules');
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      
      const schedulesData = await response.json();
      
      // スケジュールが存在するか確認
      if (schedulesData.length === 0) {
        setHasSchedule(false);
        setWeeklySchedule([]);
        return;
      }
      
      // 最新のスケジュールを取得
      const latestSchedule = schedulesData[schedulesData.length - 1];
      
      // スケジュールの詳細を取得
      const scheduleDetailResponse = await fetch(`http://localhost:5012/api/schedules/${latestSchedule.id}`);
      if (!scheduleDetailResponse.ok) throw new Error(`API Error: ${scheduleDetailResponse.status} ${scheduleDetailResponse.statusText}`);
      
      const scheduleDetail = await scheduleDetailResponse.json();
      
      // スケジュールの割り当てが存在するか確認
      if (!scheduleDetail.assignments || scheduleDetail.assignments.length === 0) {
        setHasSchedule(false);
        setWeeklySchedule([]);
        return;
      }
      
      // 曜日ごとにグループ化
      const days = ['月', '火', '水', '木', '金'];
      const libraries = await fetch('http://localhost:5012/api/libraries').then(res => res.json());
      
      // 曜日ごとのデータを作成
      const weeklyData = days.map(day => {
        // 実際のデータを使用する場合は、ここで曜日に対応する割り当てをフィルタリング
        const duties = libraries.map((library: Library) => ({
          location: library.name,
          members: [
            // ダミーデータを返す
            { 
              name: `委員${Math.floor(Math.random() * 10) + 1}`, 
              icon: ['🌸', '🌺', '🌼', '🌊', '🚀'][Math.floor(Math.random() * 5)], 
              className: `${Math.random() > 0.5 ? '5' : '6'}年${Math.floor(Math.random() * 3) + 1}組` 
            },
            { 
              name: `委員${Math.floor(Math.random() * 10) + 11}`, 
              icon: ['🌸', '🌺', '🌼', '🌊', '🚀'][Math.floor(Math.random() * 5)], 
              className: `${Math.random() > 0.5 ? '5' : '6'}年${Math.floor(Math.random() * 3) + 1}組` 
            }
          ]
        }));
        
        return { day, duties };
      });
      
      setWeeklySchedule(weeklyData);
      setHasSchedule(true);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setScheduleError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
      // エラー時はダミーデータを表示しない
      setWeeklySchedule([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ページ読み込み時にスケジュールを取得
  useEffect(() => {
    fetchWeeklySchedule();
  }, []);
  
  // 現在の曜日を取得して本日の当番を設定
  useEffect(() => {
    const getDayOfWeek = () => {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return days[new Date().getDay()];
    };
    
    setCurrentDay(getDayOfWeek());
  }, []);
  
  // 本日のスケジュールをメモ化
  const todaySchedule = useMemo(() => {
    return weeklySchedule.find(schedule => schedule.day === currentDay);
  }, [weeklySchedule, currentDay]);

  return (
    <PageLayout userName={userName} schoolName={schoolName}>
      <div className="grid grid-cols-1 gap-8 animate-fadeIn">
        {/* 今日の当番 */}
        <Card className="p-6">
          <TodayDuties currentDay={currentDay} duties={todaySchedule?.duties} />
        </Card>
        
        {/* 週間スケジュール */}
        <Card className="p-6">
          {isLoading ? (
            <p className="text-center py-8">スケジュールを読み込み中...</p>
          ) : scheduleError ? (
            <p className="text-center text-red-500 py-8">エラー: {scheduleError}</p>
          ) : !hasSchedule ? (
            <div className="text-center py-8">
              <p className="mb-4">スケジュールが登録されていません。</p>
              <a href="/management/generate-schedule" className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">
                スケジュールを作成する
              </a>
            </div>
          ) : (
            <WeeklySchedule weeklySchedule={weeklySchedule} />
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
