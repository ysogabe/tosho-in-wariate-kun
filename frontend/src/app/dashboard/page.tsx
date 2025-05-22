'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import PageLayout from '../_components/PageLayout';
import TodayDuties from '../_components/TodayDuties';
import WeeklySchedule from '../_components/WeeklySchedule';
import { Card } from '@/components/ui/card';

const DashboardPage = () => {
  const [userName] = useState('管理者');
  const { schoolName } = useSchool(); // SchoolContextから学校名を取得
  const [currentDay, setCurrentDay] = useState<string>('');
  
  // 週間スケジュール情報 - 曜日単位で図書委員を割り当て
  const [weeklySchedule] = useState([
    { day: '月', duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '山田花子', icon: '🌸', className: '5年1組' },
          { name: '佐藤太郎', icon: '🚀', className: '6年2組' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '鈴木一郎', icon: '📚', className: '4年3組' }
        ] 
      },
    ]},
    { day: '火', duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '田中めぐみ', icon: '🌺', className: '5年2組' },
          { name: '高橋健太', icon: '🏃', className: '6年1組' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '伊藤さくら', icon: '🌸', className: '4年1組' }
        ] 
      },
    ]},
    { day: '水', duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '渡辺結衣', icon: '🌼', className: '5年3組' },
          { name: '小林大輔', icon: '🏆', className: '6年3組' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '加藤悠真', icon: '📖', className: '4年2組' }
        ] 
      },
    ]},
    { day: '木', duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '松本さやか', icon: '🌻', className: '5年2組' },
          { name: '井上拓海', icon: '🌊', className: '6年1組' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '佐々木美咲', icon: '🌷', className: '4年3組' }
        ] 
      },
    ]},
    { day: '金', duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '山本航', icon: '✈️', className: '5年1組' },
          { name: '中村あおい', icon: '🌊', className: '6年2組' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '斉藤健', icon: '🏃', className: '4年1組' }
        ] 
      },
    ]},
  ]);
  
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
          <WeeklySchedule weeklySchedule={weeklySchedule} />
        </Card>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
