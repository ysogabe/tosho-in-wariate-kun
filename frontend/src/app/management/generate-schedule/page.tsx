'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCalendarAlt, FaSpinner, FaChevronDown } from 'react-icons/fa';

export default function GenerateSchedulePage() {
  const [academicYear, setAcademicYear] = useState('2025年度');
  const [semester, setSemester] = useState('前期（4月～9月）');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<null | { success: boolean, message: string, scheduleId?: number }>(null);
  const [error, setError] = useState<string | null>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);

  // 年度のオプション
  const yearOptions = ['2025年度', '2026年度', '2027年度', '2028年度', '2029年度'];
  
  // 学期のオプション
  const semesterOptions = ['前期（4月～9月）', '後期（10月～3月）'];

  // 年度と学期に基づいて日付範囲を設定
  useEffect(() => {
    const year = parseInt(academicYear.replace('年度', ''));
    
    if (semester === '前期（4月～9月）') {
      setStartDate(`${year}-04-01`);
      setEndDate(`${year}-09-30`);
    } else {
      setStartDate(`${year}-10-01`);
      setEndDate(`${year + 1}-03-31`);
    }
  }, [academicYear, semester]);

  // スケジュールを生成
  const generateSchedule = async () => {
    if (!startDate || !endDate || !academicYear) {
      setError('期間および学年度を入力してください');
      return;
    }

    setIsGenerating(true);
    setGeneratedSchedule(null);
    setError(null);

    try {
      // APIを呼び出してスケジュールを生成
      const response = await fetch('http://localhost:5012/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${academicYear}${semester}スケジュール`,
          description: `${academicYear}の${semester}の図書委員当番スケジュール`,
          startDate,
          endDate,
          academicYear: academicYear.replace('年度', ''),
          isFirstHalf: semester.includes('前期')
        }),
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const result = await response.json();
      setIsGenerating(false);
      setGeneratedSchedule({
        success: true,
        message: result.message || 'スケジュールが正常に生成されました',
        scheduleId: result.scheduleId
      });
    } catch (error) {
      console.error('スケジュール生成中にエラーが発生しました:', error);
      setIsGenerating(false);
      setGeneratedSchedule({
        success: false,
        message: `スケジュール生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // 年度を選択
  const selectYear = (year: string) => {
    setAcademicYear(year);
    setYearDropdownOpen(false);
  };

  // 学期を選択
  const selectSemester = (sem: string) => {
    setSemester(sem);
    setSemesterDropdownOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ スケジュール生成 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-pink-200 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6">スケジュールの詳細を入力</h2>
        <p className="text-text-light mb-6">
          スケジュール名と期間を設定し、担当する図書委員を選択してください。
        </p>

        {error && (
          <h2 className="text-xl font-bold text-text mb-6">年度と学期を指定してスケジュールを生成</h2>
        )}
        <p className="text-gray-600 mb-6">スケジュールは半期（前期・後期）の修正を行い、曜日単位で図書委員を割り当てます。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 mb-2">年度</label>
            <div className="relative">
              <button 
                onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              >
                <span>{academicYear}</span>
                <FaChevronDown className="text-gray-400" />
              </button>
              
              {yearDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => selectYear(year)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">学期</label>
            <div className="relative">
              <button 
                onClick={() => setSemesterDropdownOpen(!semesterDropdownOpen)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              >
                <span>{semester}</span>
                <FaChevronDown className="text-gray-400" />
              </button>
              
              {semesterDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {semesterOptions.map((sem) => (
                    <button
                      key={sem}
                      onClick={() => selectSemester(sem)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className={`px-8 py-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors flex items-center ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                生成中...
              </>
            ) : (
              <>
                <FaCalendarAlt className="mr-2" />
                スケジュールを生成
              </>
            )}
          </button>
        </div>

        {generatedSchedule && (
          <div className={`mt-8 p-4 rounded-lg ${generatedSchedule.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <p className="font-medium">{generatedSchedule.message}</p>
            {generatedSchedule.success && (
              <div className="mt-4 flex justify-center">
                <Link
                  href={generatedSchedule.scheduleId ? `/management/validate-schedule?id=${generatedSchedule.scheduleId}` : "/management/validate-schedule"}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  生成されたスケジュールを確認
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-pink-200">
        <h2 className="text-xl font-bold text-text mb-4">スケジュール生成について</h2>
        <p className="text-text-light mb-3">
          このツールは設定されたルールに基づいて図書委員の当番スケジュールを自動生成します。
        </p>
        <p className="text-text-light mb-3">
          スケジュールは年2回（前期・後期）の修正を行い、曜日単位で図書委員を割り当てます。日付単位での割当は行いません。
        </p>
        <p className="text-text-light mb-3">
          生成前に以下の項目が設定されていることを確認してください：
        </p>
        <ul className="list-disc list-inside text-text-light space-y-2 mb-3">
          <li>図書委員の登録</li>
          <li>図書室情報の登録</li>
          <li>スケジュールルールの設定</li>
        </ul>
        <p className="text-text-light">
          生成されたスケジュールは「スケジュール検証」画面で確認し、必要に応じて手動で調整できます。
        </p>
      </div>
    </div>
  );
}
