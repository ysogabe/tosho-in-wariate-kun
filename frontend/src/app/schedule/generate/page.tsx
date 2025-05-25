'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Member {
  id: number;
  name: string;
  grade_name: string;
  class_name: string;
  role: string;
  grade_id: number;
  class_id: number;
}

interface ExcludedDate {
  id: number;
  memberId: number;
  date: string;
  reason: string;
}

const API_BASE_URL = 'http://localhost:5001/api';

export default function ScheduleGeneratePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [scheduleName, setScheduleName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  
  const [isExcludedDatesModalOpen, setIsExcludedDatesModalOpen] = useState(false);
  const [excludedDates, setExcludedDates] = useState<ExcludedDate[]>([]);
  const [selectedMemberForExclusion, setSelectedMemberForExclusion] = useState<number | null>(null);
  const [excludeDate, setExcludeDate] = useState('');
  const [excludeReason, setExcludeReason] = useState('');

  // メンバー選択を切り替え
  const toggleMemberSelection = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  // 除外日モーダルを開く
  const openExcludedDatesModal = () => {
    setIsExcludedDatesModalOpen(true);
  };

  // 除外日モーダルを閉じる
  const closeExcludedDatesModal = () => {
    setIsExcludedDatesModalOpen(false);
    setSelectedMemberForExclusion(null);
    setExcludeDate('');
    setExcludeReason('');
  };

  // 除外日を追加
  const addExcludedDate = () => {
    if (!selectedMemberForExclusion) {
      alert('図書委員を選択してください');
      return;
    }

    if (!excludeDate) {
      alert('日付を選択してください');
      return;
    }

    if (!excludeReason.trim()) {
      alert('理由を入力してください');
      return;
    }

    const newId = Math.max(0, ...excludedDates.map(date => date.id)) + 1;
    const newExcludedDate: ExcludedDate = {
      id: newId,
      memberId: selectedMemberForExclusion,
      date: excludeDate,
      reason: excludeReason
    };

    setExcludedDates([...excludedDates, newExcludedDate]);
    setSelectedMemberForExclusion(null);
    setExcludeDate('');
    setExcludeReason('');
  };

  // 除外日を削除
  const removeExcludedDate = (id: number) => {
    setExcludedDates(excludedDates.filter(date => date.id !== id));
  };

  // メンバー名を取得
  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : '';
  };
  
  // メンバー情報を表示
  const getMemberInfo = (member: Member) => {
    return `${member.name} (${member.grade_name} ${member.class_name})`;
  };

  // 図書委員データを取得
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`${API_BASE_URL}/committee-members`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // 5年生と6年生のみをフィルタリング
        const filteredMembers = data.filter((member: Member) => 
          member.grade_name.includes('5') || member.grade_name.includes('6')
        );
        setMembers(filteredMembers);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '図書委員データの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // スケジュールを生成
  const generateSchedule = async () => {
    // バリデーション
    if (!scheduleName.trim()) {
      alert('スケジュール名を入力してください');
      return;
    }

    if (!startDate) {
      alert('開始日を選択してください');
      return;
    }

    if (!endDate) {
      alert('終了日を選択してください');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('終了日は開始日より後にしてください');
      return;
    }

    if (selectedMembers.length < 1) {
      alert('少なくとも1人の図書委員を選択してください');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const formData = {
        name: scheduleName,
        description: description,
        startDate: startDate,
        endDate: endDate,
        selectedMembers: selectedMembers,
        excludedDates: excludedDates,
      };

      // バリデーションチェック
      if (!formData.name || !formData.startDate || !formData.endDate) {
        setErrorMessage('必須項目を入力してください');
        return;
      }

      if (formData.selectedMembers.length < 2) {
        setErrorMessage('少なくとも2人の図書委員を選択してください');
        return;
      }

      // スケジュール生成APIを呼び出す
      const response = await fetch(`${API_BASE_URL}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'スケジュール生成に失敗しました');
      }

      const data = await response.json();
      alert('スケジュールが正常に生成されました');
      
      // 生成されたスケジュールの詳細ページに遷移
      router.push(`/schedule/detail/${data.scheduleId}`);
    } catch (err) {
      console.error('スケジュール生成エラー:', err);
      setErrorMessage(err instanceof Error ? err.message : 'スケジュール生成に失敗しました');
      alert('スケジュール生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フォームをクリア
  const clearForm = () => {
    if (confirm('入力内容をクリアしますか？')) {
      setScheduleName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setSelectedMembers([]);
      setExcludedDates([]);
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
      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      
      {/* フォーム */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-bold mb-6">スケジュール生成</h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    スケジュール名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="例: 2025年度前期スケジュール"
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="スケジュールの説明（任意）"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了日
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    対象図書委員
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {members.map((member) => (
                      <div className="flex items-center mb-2" key={member.id}>
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`member-${member.id}`} className="ml-2 text-sm text-gray-700">
                          {getMemberInfo(member)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      除外日設定
                    </label>
                    <button
                      type="button"
                      onClick={openExcludedDatesModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                    >
                      除外日を設定
                    </button>
                  </div>
                  {excludedDates.length === 0 ? (
                    <p className="text-gray-500 italic">除外日が設定されていません</p>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">設定済みの除外日</h4>
                      <ul className="space-y-2">
                        {excludedDates.map((date) => (
                          <li key={date.id} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{getMemberName(date.memberId)}</span>: 
                              <span className="ml-2">{date.date}</span> - 
                              <span className="ml-2 text-gray-600">{date.reason}</span>
                            </div>
                            <button
                              onClick={() => removeExcludedDate(date.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={clearForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  クリア
                </button>
                <button
                  type="button"
                  onClick={generateSchedule}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {loading ? 'スケジュール生成中...' : 'スケジュールを生成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 除外日設定モーダル */}
      {isExcludedDatesModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                除外日設定
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  図書委員
                </label>
                <select
                  value={selectedMemberForExclusion || ''}
                  onChange={(e) => setSelectedMemberForExclusion(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">図書委員を選択</option>
                  {members
                    .filter(member => selectedMembers.includes(member.id))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {getMemberInfo(member)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={excludeDate}
                  onChange={(e) => setExcludeDate(e.target.value)}
                  min={startDate || undefined}
                  max={endDate || undefined}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  理由
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={excludeReason}
                  onChange={(e) => setExcludeReason(e.target.value)}
                  placeholder="例: 体育祭参加のため"
                />
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addExcludedDate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto"
                >
                  追加
                </button>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">設定済みの除外日</h4>
                {excludedDates.length === 0 ? (
                  <p className="text-gray-500 italic">除外日が設定されていません</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {excludedDates.map((date) => (
                      <li key={date.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{getMemberName(date.memberId)}</span>: 
                          <span className="ml-2">{date.date}</span> - 
                          <span className="ml-2 text-gray-600">{date.reason}</span>
                        </div>
                        <button
                          onClick={() => removeExcludedDate(date.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={closeExcludedDatesModal}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white shadow mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">© 2025 図書当番割り当てくん</p>
        </div>
      </footer>
    </div>
  );
}
