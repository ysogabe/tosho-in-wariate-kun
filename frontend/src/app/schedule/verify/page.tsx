'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ScheduleWeeklyView from '@/app/_components/ScheduleWeeklyView';

interface ValidationResult {
  id: number;
  rule: string;
  type: 'success' | 'warning' | 'error';
  description: string;
  details: string[];
}

interface Schedule {
  id: number;
  name: string;
  description?: string;
  academic_year: number;
  is_first_half: boolean;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ScheduleSummary {
  totalAssignments: number;
  totalMembers: number;
  averageAssignmentsPerMember: number;
  startDate: string;
  endDate: string;
}

const API_BASE_URL = 'http://localhost:5100/api';

export default function ScheduleVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // スケジュール一覧を取得
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/schedules`);
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        const data: Schedule[] = await response.json();
        setSchedules(data);

        // URLパラメータからスケジュールIDを取得
        const scheduleIdParam = searchParams.get('scheduleId');
        if (scheduleIdParam) {
          const scheduleId = parseInt(scheduleIdParam);
          const schedule = data.find(s => s.id === scheduleId);
          if (schedule) {
            setSelectedScheduleId(scheduleId);
            setSelectedSchedule(schedule);
          }
        } else if (data.length > 0) {
          // デフォルトで最新のスケジュールを選択
          const latestSchedule = data[0];
          setSelectedScheduleId(latestSchedule.id);
          setSelectedSchedule(latestSchedule);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました。');
        console.error(err);
      } finally {
        setIsLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, [searchParams]);

  // 選択されたスケジュールが変更された時の処理
  useEffect(() => {
    if (!selectedSchedule) {
      setValidationResults([]);
      setScheduleSummary(null);
      setIsLoading(false);
      return;
    }

    // 簡単な検証結果を生成（実際の実装では詳細な検証を行う）
    const generateValidationResults = () => {
      const results: ValidationResult[] = [
        {
          id: 1,
          rule: 'スケジュール基本情報',
          type: 'success',
          description: `${selectedSchedule.name}のスケジュールが正常に作成されています`,
          details: [
            `年度: ${selectedSchedule.academic_year}年度`,
            `期間: ${selectedSchedule.is_first_half ? '前期' : '後期'}`,
            `開始日: ${selectedSchedule.start_date}`,
            `終了日: ${selectedSchedule.end_date}`
          ]
        },
        {
          id: 2,
          rule: 'スケジュール状態',
          type: selectedSchedule.status === 'active' ? 'success' : 'warning',
          description: `スケジュール状態: ${selectedSchedule.status}`,
          details: [
            `作成日時: ${selectedSchedule.created_at}`,
            `更新日時: ${selectedSchedule.updated_at}`
          ]
        }
      ];

      setValidationResults(results);
      
      // 簡単な統計情報（実際の実装では割り当てデータから計算）
      const summary: ScheduleSummary = {
        totalAssignments: 0, // 実際の割り当て数
        totalMembers: 0, // 実際のメンバー数
        averageAssignmentsPerMember: 0,
        startDate: selectedSchedule.start_date,
        endDate: selectedSchedule.end_date
      };
      setScheduleSummary(summary);
      setIsLoading(false);
    };

    setIsLoading(true);
    setTimeout(generateValidationResults, 500); // 少し遅延を入れて読み込み感を演出
  }, [selectedSchedule]);

  // スケジュール選択の変更
  const handleScheduleChange = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === parseInt(scheduleId));
    if (schedule) {
      setSelectedScheduleId(schedule.id);
      setSelectedSchedule(schedule);
    }
  };

  // スケジュールを採用
  const adoptSchedule = () => {
    if (confirm('このスケジュールを採用しますか？')) {
      // 実際のアプリではAPIにリクエストを送信する
      alert('スケジュールを採用しました');
      router.push('/schedule/weekly');
    }
  };

  // スケジュールを再生成
  const regenerateSchedule = () => {
    if (confirm('スケジュールを再生成しますか？')) {
      // 実際のアプリではAPIにリクエストを送信する
      alert('スケジュール再生成を開始します');
      setIsLoading(true);
      
      // 再生成のシミュレーション
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  // ルールタイプに応じたアイコンとスタイルを取得
  const getRuleTypeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'warning':
        return {
          icon: '⚠',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'error':
        return {
          icon: '✗',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: 'i',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
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
          <div className="flex items-center mb-6">
            <Link href="/schedule/generate">
              <button className="mr-4 text-blue-600 hover:text-blue-800">
                ← スケジュール生成へ戻る
              </button>
            </Link>
            <h2 className="text-2xl font-bold">スケジュール検証結果</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white shadow rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 mb-2">検証結果を読み込み中...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  {/* スケジュール選択 */}
                  <div className="mb-6">
                    <label htmlFor="schedule-select" className="block text-sm font-medium text-gray-700 mb-1">
                      検証するスケジュール
                    </label>
                    {isLoadingSchedules ? (
                      <p className="text-gray-500">スケジュールを読み込み中...</p>
                    ) : error ? (
                      <p className="text-red-500">エラー: {error}</p>
                    ) : schedules.length === 0 ? (
                      <p className="text-gray-500">利用可能なスケジュールがありません。</p>
                    ) : (
                      <select
                        id="schedule-select"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={selectedScheduleId ?? ''}
                        onChange={(e) => handleScheduleChange(e.target.value)}
                        disabled={schedules.length === 0}
                      >
                        {schedules.map((schedule) => (
                          <option key={schedule.id} value={schedule.id}>
                            {schedule.name} ({schedule.academic_year}年度 {schedule.is_first_half ? '前期' : '後期'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedSchedule && (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {selectedSchedule.name}の検証結果
                      </h3>
                      
                      {/* スケジュール基本情報 */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-2">スケジュール情報</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">年度:</span>
                            <span className="ml-1">{selectedSchedule.academic_year}年度</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">期間:</span>
                            <span className="ml-1">{selectedSchedule.is_first_half ? '前期' : '後期'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">開始日:</span>
                            <span className="ml-1">{selectedSchedule.start_date}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">終了日:</span>
                            <span className="ml-1">{selectedSchedule.end_date}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">状態:</span>
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              selectedSchedule.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedSchedule.status}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ID:</span>
                            <span className="ml-1">{selectedSchedule.id}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {scheduleSummary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                      <h4 className="text-md font-medium text-blue-800 mb-2">スケジュール概要</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">期間</p>
                          <p className="text-md font-medium">{scheduleSummary.startDate} 〜 {scheduleSummary.endDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">総当番数</p>
                          <p className="text-md font-medium">{scheduleSummary.totalAssignments}回</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">図書委員数</p>
                          <p className="text-md font-medium">{scheduleSummary.totalMembers}人</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">平均当番回数</p>
                          <p className="text-md font-medium">{scheduleSummary.averageAssignmentsPerMember}回/人</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 週間スケジュール表示 */}
                  {selectedScheduleId && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">週間スケジュール表示</h4>
                      <ScheduleWeeklyView 
                        scheduleId={selectedScheduleId}
                        className="border-2 border-gray-200"
                        showEmpty={true}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {validationResults.map((result) => {
                      const style = getRuleTypeStyle(result.type);
                      return (
                        <div 
                          key={result.id} 
                          className={`${style.bgColor} ${style.borderColor} border rounded-md p-4`}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-6 w-6 ${style.textColor} flex items-center justify-center rounded-full text-sm font-bold`}>
                              {style.icon}
                            </div>
                            <div className="ml-3">
                              <h4 className={`text-md font-medium ${style.textColor}`}>{result.rule}</h4>
                              <p className="text-sm mt-1">{result.description}</p>
                              {result.details.length > 0 && (
                                <div className="mt-2">
                                  <details>
                                    <summary className="text-sm font-medium cursor-pointer">詳細を表示</summary>
                                    <ul className="mt-2 pl-5 text-sm list-disc">
                                      {result.details.map((detail, index) => (
                                        <li key={index}>{detail}</li>
                                      ))}
                                    </ul>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      onClick={regenerateSchedule}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      スケジュール再生成
                    </button>
                    <button
                      onClick={adoptSchedule}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      このスケジュールを採用
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">検証結果について</h3>
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>
                      スケジュール検証では、設定したルールに基づいてスケジュールの品質を評価します。
                      結果は以下の3つのレベルで表示されます：
                    </p>
                    <ul className="pl-5 list-disc space-y-2">
                      <li className="text-green-600">
                        <span className="font-medium">成功（緑）</span>: ルールが完全に満たされています
                      </li>
                      <li className="text-yellow-600">
                        <span className="font-medium">警告（黄）</span>: ルールが部分的に満たされていない箇所があります
                      </li>
                      <li className="text-red-600">
                        <span className="font-medium">エラー（赤）</span>: ルールが満たされていない重大な問題があります
                      </li>
                    </ul>
                    <p>
                      警告やエラーがある場合は、スケジュールを再生成するか、
                      採用後に手動で調整することができます。
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
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
