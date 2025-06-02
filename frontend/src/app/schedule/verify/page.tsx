'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ValidationResult {
  id: number;
  rule: string;
  type: 'success' | 'warning' | 'error';
  description: string;
  details: string[];
}

interface ScheduleSummary {
  totalAssignments: number;
  totalMembers: number;
  averageAssignmentsPerMember: number;
  startDate: string;
  endDate: string;
}

export default function ScheduleVerifyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleName] = useState('2025年度前期スケジュール');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);

  // モックデータをロード
  useEffect(() => {
    // 実際のアプリではAPIからデータを取得する
    setTimeout(() => {
      const mockValidationResults: ValidationResult[] = [
        {
          id: 1,
          rule: '必要人数確保',
          type: 'success',
          description: 'すべての図書室に必要な人数が配置されています',
          details: ['図書室A: 必要人数2名に対して、すべての時間帯で2名以上配置されています']
        },
        {
          id: 2,
          rule: '同一人物の連続当番禁止',
          type: 'success',
          description: '同じ人が連続して当番に入ることはありません',
          details: ['すべての図書委員について、連続した当番はありません']
        },
        {
          id: 3,
          rule: '学年バランス',
          type: 'warning',
          description: '一部の当番で学年バランスが取れていません',
          details: [
            '4月10日(木) 12:30-13:00: 同じ学年の生徒のみが配置されています',
            '4月11日(金) 12:30-13:00: 同じ学年の生徒のみが配置されています'
          ]
        },
        {
          id: 4,
          rule: '当番回数の均等化',
          type: 'error',
          description: '当番回数に大きな偏りがあります',
          details: [
            '山田太郎: 5回',
            '佐藤花子: 4回',
            '鈴木一郎: 4回',
            '高橋明: 4回',
            '渡辺健太: 2回',
            '中村さくら: 2回',
            '小林和也: 1回',
            '加藤美咲: 1回'
          ]
        }
      ];

      const mockScheduleSummary: ScheduleSummary = {
        totalAssignments: 24,
        totalMembers: 8,
        averageAssignmentsPerMember: 3,
        startDate: '2025/4/1',
        endDate: '2025/7/31'
      };

      setValidationResults(mockValidationResults);
      setScheduleSummary(mockScheduleSummary);
      setIsLoading(false);
    }, 1000);
  }, []);

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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {scheduleName}の検証結果
                  </h3>
                  
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
