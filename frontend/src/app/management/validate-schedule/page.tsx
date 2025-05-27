'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { FaArrowLeft, FaSpinner, FaCheck, FaRedo } from 'react-icons/fa';
import ScheduleWeeklyView from '@/app/_components/ScheduleWeeklyView';

// 型定義
interface ApiSchedule {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  year: number;
  semester: string;
  academic_year: number;
  is_first_half: boolean;
  status: string;
  assignments: Array<{
    id: number;
    library_id: number;
    library_name: string;
    date: string;
    time_slot: string;
    day_of_week: number;
    assigned_committee_members: Array<{
      id: number;
      name: string;
      role: string;
    }>;
  }>;
}

export default function ValidateSchedulePage() {
  const searchParams = useSearchParams();
  const scheduleIdParam = searchParams.get('id');

  // 状態管理
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター用の状態
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [firstHalfSchedule, setFirstHalfSchedule] = useState<ApiSchedule | null>(null);
  const [secondHalfSchedule, setSecondHalfSchedule] = useState<ApiSchedule | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // スケジュールデータを取得
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const allSchedules = await api.schedules.getAll() as ApiSchedule[];
        setSchedules(allSchedules);
        
        // 利用可能な年度を抽出
        const years = [...new Set(allSchedules.map(s => s.academic_year || new Date(s.start_date).getFullYear()))].sort((a, b) => b - a);
        setAvailableYears(years);
        
        // URLパラメータでスケジュールIDが指定されている場合
        let yearToSelect = years.length > 0 ? years[0] : null;
        if (scheduleIdParam) {
          const scheduleId = parseInt(scheduleIdParam, 10);
          const targetSchedule = allSchedules.find(s => s.id === scheduleId);
          if (targetSchedule) {
            yearToSelect = targetSchedule.academic_year || new Date(targetSchedule.start_date).getFullYear();
          }
        }
        
        // 年度を設定してスケジュールを読み込む
        if (yearToSelect) {
          setSelectedYear(yearToSelect);
          await loadSchedulesForYear(yearToSelect, allSchedules);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('スケジュールの取得に失敗しました:', error);
        setError('スケジュールの取得に失敗しました');
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [scheduleIdParam]);

  // 選択された年度のスケジュールを読み込む
  const loadSchedulesForYear = async (year: number, allSchedules: ApiSchedule[]) => {
    // 前期のスケジュールを探す
    const firstHalf = allSchedules.find(s => 
      (s.academic_year || new Date(s.start_date).getFullYear()) === year && 
      (s.is_first_half !== undefined ? s.is_first_half : s.semester === 'first')
    );
    
    // 後期のスケジュールを探す
    const secondHalf = allSchedules.find(s => 
      (s.academic_year || new Date(s.start_date).getFullYear()) === year && 
      (s.is_first_half !== undefined ? !s.is_first_half : s.semester === 'second')
    );
    
    // 詳細情報を取得
    if (firstHalf) {
      try {
        const detailedFirstHalf = await api.schedules.getById(firstHalf.id) as ApiSchedule;
        setFirstHalfSchedule(detailedFirstHalf);
      } catch (error) {
        console.error('前期スケジュールの取得に失敗しました:', error);
        setFirstHalfSchedule(null);
      }
    } else {
      setFirstHalfSchedule(null);
    }
    
    if (secondHalf) {
      try {
        const detailedSecondHalf = await api.schedules.getById(secondHalf.id) as ApiSchedule;
        setSecondHalfSchedule(detailedSecondHalf);
      } catch (error) {
        console.error('後期スケジュールの取得に失敗しました:', error);
        setSecondHalfSchedule(null);
      }
    } else {
      setSecondHalfSchedule(null);
    }
  };

  // 年度の変更
  const handleYearChange = async (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    setLoading(true);
    
    // 新しい年度のスケジュールを読み込む
    await loadSchedulesForYear(yearNum, schedules);
    setLoading(false);
  };
  
  // スケジュールを承認する
  const approveSchedule = async (_scheduleId: number, isFirstHalf: boolean) => {
    try {
      // TODO: 実際のAPIコールを実装
      // await api.schedules.approve(_scheduleId);
      
      setSuccessMessage(`${isFirstHalf ? '前期' : '後期'}スケジュールを承認しました`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // スケジュールを再読み込み
      await loadSchedulesForYear(selectedYear!, schedules);
    } catch (error) {
      console.error('スケジュールの承認に失敗しました:', error);
      alert('スケジュールの承認に失敗しました');
    }
  };
  
  // スケジュールを再生成する
  const regenerateSchedule = (isFirstHalf: boolean) => {
    if (confirm(`${isFirstHalf ? '前期' : '後期'}スケジュールを再生成しますか？\n現在のスケジュールは削除されます。`)) {
      // スケジュール生成画面に遷移
      window.location.href = '/management/generate-schedule';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
            <FaArrowLeft className="text-2xl" />
          </Link>
          <h1 className="text-3xl font-bold text-text">✔️ スケジュール検証 ✔️</h1>
        </div>
        
        {/* 年度選択 */}
        <div className="flex items-center space-x-2">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
            年度:
          </label>
          <select
            id="year-select"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            value={selectedYear ?? ''}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={availableYears.length === 0 || loading}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}年度
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-primary" />
          <span className="ml-3 text-xl">スケジュールを読み込み中...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      ) : (
        <>
          {successMessage && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 animate-fadeIn">
              {successMessage}
            </div>
          )}
          
          {/* 前期スケジュール */}
          <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-text">前期スケジュール</h3>
                {firstHalfSchedule && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    firstHalfSchedule.status === 'active' || firstHalfSchedule.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {firstHalfSchedule.status === 'active' || firstHalfSchedule.status === 'approved' ? '承認済み' : '未承認'}
                  </span>
                )}
              </div>
              {firstHalfSchedule && (firstHalfSchedule.status !== 'active' && firstHalfSchedule.status !== 'approved') && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => approveSchedule(firstHalfSchedule.id, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <FaCheck className="mr-2" /> 承認
                  </button>
                  <button
                    onClick={() => regenerateSchedule(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <FaRedo className="mr-2" /> 再作成
                  </button>
                </div>
              )}
            </div>
            {firstHalfSchedule ? (
              <ScheduleWeeklyView 
                scheduleId={firstHalfSchedule.id}
                className="border-2 border-gray-200"
                showEmpty={true}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">
                  {selectedYear}年度前期のスケジュールはまだ作成されていません。
                </p>
                <Link href="/management/generate-schedule" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                  スケジュールを生成
                </Link>
              </div>
            )}
          </div>

          {/* 後期スケジュール */}
          <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-text">後期スケジュール</h3>
                {secondHalfSchedule && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    secondHalfSchedule.status === 'active' || secondHalfSchedule.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {secondHalfSchedule.status === 'active' || secondHalfSchedule.status === 'approved' ? '承認済み' : '未承認'}
                  </span>
                )}
              </div>
              {secondHalfSchedule && (secondHalfSchedule.status !== 'active' && secondHalfSchedule.status !== 'approved') && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => approveSchedule(secondHalfSchedule.id, false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <FaCheck className="mr-2" /> 承認
                  </button>
                  <button
                    onClick={() => regenerateSchedule(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <FaRedo className="mr-2" /> 再作成
                  </button>
                </div>
              )}
            </div>
            {secondHalfSchedule ? (
              <ScheduleWeeklyView 
                scheduleId={secondHalfSchedule.id}
                className="border-2 border-gray-200"
                showEmpty={true}
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">
                  {selectedYear}年度後期のスケジュールはまだ作成されていません。
                </p>
                <Link href="/management/generate-schedule" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                  スケジュールを生成
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}