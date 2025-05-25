'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { FaArrowLeft, FaCheck, FaEdit, FaTimes, FaSpinner, FaSave } from 'react-icons/fa';

// 型定義
interface Member {
  name: string;
  icon: string;
}

interface Duty {
  location: string;
  members: Member[];
}

interface ScheduleItem {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  day_of_week: number;
  day: string;
  duties: Duty[];
  approved: boolean;
  year: number;
  semester: string;
}

interface ApiSchedule {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  year: number;
  semester: string;
  assignments: Array<{
    id: number;
    library_id: number;
    library_name: string;
    date: string;
    time_slot: string;
    assigned_committee_members: Array<{
      id: number;
      name: string;
      role: string;
    }>;
  }>;
}

// スケジュール関連の型定義は上記のみを使用

export default function ValidateSchedulePage() {
  const searchParams = useSearchParams();
  const scheduleIdParam = searchParams.get('id');

  // 状態管理
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // スケジュールデータの初期化
  useEffect(() => {
    // データ取得はスケジュールのみに簡素化
    // 必要に応じて後で図書室と図書委員のデータを取得するように変更
  }, []);

  // スケジュールデータを取得
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        // 特定のスケジュールIDが指定されている場合はそれを取得、なければ全て取得
        if (scheduleIdParam) {
          const scheduleId = parseInt(scheduleIdParam, 10);
          // スケジュールデータを取得
          const scheduleData = await api.schedules.getById(scheduleId) as ApiSchedule;
          processScheduleData([scheduleData]);
        } else {
          const schedulesData = await api.schedules.getAll();
          // 各スケジュールの詳細情報を取得
          const detailedSchedules = await Promise.all(
            schedulesData.map(schedule => api.schedules.getById(schedule.id))
          ) as ApiSchedule[];
          
          processScheduleData(detailedSchedules);
        }
      } catch (error) {
        console.error('スケジュールの取得に失敗しました:', error);
        setError('スケジュールの取得に失敗しました');
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [scheduleIdParam]);

  // APIから取得したスケジュールデータを処理
  const processScheduleData = (apiSchedules: ApiSchedule[]) => {
    const dayMapping: Record<number, string> = {
      0: '日曜日',
      1: '月曜日',
      2: '火曜日',
      3: '水曜日',
      4: '木曜日',
      5: '金曜日',
      6: '土曜日'
    };

    // APIから取得したデータを整形
    const processedSchedules = apiSchedules.map(apiSchedule => {
      // 曜日を取得（日付から曜日を計算）
      const date = new Date(apiSchedule.start_date);
      const dayOfWeek = date.getDay();
      const day = dayMapping[dayOfWeek];

      // 担当者情報を整形
      const duties = apiSchedule.assignments.reduce((acc: Duty[], assignment) => {
        const existingDutyIndex = acc.findIndex(duty => duty.location === assignment.library_name);
        
        // アイコンをランダムに選択
        const icons = ['🌸', '🚀', '📚', '🌺', '🏃', '🌼', '🏆', '📖', '🌻', '🌊', '🌷', '✈️'];
        
        if (existingDutyIndex >= 0) {
          // 既に同じ図書室の担当がある場合は、そこにメンバーを追加
          assignment.assigned_committee_members.forEach(member => {
            acc[existingDutyIndex].members.push({
              name: member.name,
              icon: icons[Math.floor(Math.random() * icons.length)]
            });
          });
        } else {
          // 新しい図書室の担当を追加
          acc.push({
            location: assignment.library_name,
            members: assignment.assigned_committee_members.map(member => ({
              name: member.name,
              icon: icons[Math.floor(Math.random() * icons.length)]
            }))
          });
        }
        
        return acc;
      }, []);

      return {
        id: apiSchedule.id,
        name: apiSchedule.name,
        description: apiSchedule.description,
        start_date: apiSchedule.start_date,
        end_date: apiSchedule.end_date,
        day_of_week: dayOfWeek,
        day,
        duties,
        approved: false, // 初期値は未承認
        year: apiSchedule.year,
        semester: apiSchedule.semester
      };
    });

    setSchedule(processedSchedules);
    setLoading(false);
  };

  // スケジュールを承認する処理
  const approveSchedule = (id: number) => {
    setSchedule(prevSchedule => 
      prevSchedule.map(item => 
        item.id === id ? { ...item, approved: true } : item
      )
    );
    setSuccessMessage('スケジュールが承認されました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // スケジュールを編集する処理
  const editSchedule = (id: number, duties: Duty[]) => {
    setSchedule(prevSchedule => 
      prevSchedule.map(item => 
        item.id === id ? { ...item, duties } : item
      )
    );
  };

  // スケジュールを一括承認する処理
  const approveAllSchedule = () => {
    setSchedule(prevSchedule => 
      prevSchedule.map(item => ({ ...item, approved: true }))
    );
    setSuccessMessage('すべてのスケジュールが承認されました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // スケジュールの編集を開始
  const startEditing = (id: number) => {
    const targetSchedule = schedule.find(item => item.id === id);
    if (targetSchedule) {
      setEditingSchedule(targetSchedule);
      setShowForm(true);
    }
  };

  // スケジュールの編集をキャンセル
  const cancelEditing = () => {
    setEditingSchedule(null);
    setShowForm(false);
  };

  // スケジュールの編集を保存
  const saveEditing = () => {
    if (editingSchedule) {
      editSchedule(editingSchedule.id, editingSchedule.duties);
      setSuccessMessage('スケジュールが更新されました');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowForm(false);
      setEditingSchedule(null);
    }
  };

  // 編集中のメンバーを更新
  const updateMember = (dutyIndex: number, memberIndex: number, name: string, icon: string) => {
    if (editingSchedule) {
      const newDuties = [...editingSchedule.duties];
      newDuties[dutyIndex].members[memberIndex] = { name, icon };
      setEditingSchedule({ ...editingSchedule, duties: newDuties });
    }
  };

  // メンバーを追加
  const addMember = (dutyIndex: number) => {
    if (editingSchedule) {
      const newDuties = [...editingSchedule.duties];
      newDuties[dutyIndex].members.push({ name: '', icon: '📚' });
      setEditingSchedule({ 
        ...editingSchedule, 
        duties: newDuties
      });
    }
  };

  // メンバーを削除
  const removeMember = (dutyIndex: number, memberIndex: number) => {
    if (editingSchedule) {
      const newDuties = [...editingSchedule.duties];
      newDuties[dutyIndex].members.splice(memberIndex, 1);
      setEditingSchedule({ ...editingSchedule, duties: newDuties });
    }
  };
  
  // スケジュールを非承認
  const rejectSchedule = (id: number) => {
    setSchedule(prevSchedule => 
      prevSchedule.map(item => 
        item.id === id ? { ...item, approved: false } : item
      )
    );
    setSuccessMessage('スケジュールが非承認になりました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // フィルタリングされたスケジュール
  const filteredSchedule = useMemo(() => {
    // スケジュールを曜日でソート
    const sortedSchedule = [...schedule].sort((a, b) => {
      // 曜日順にソート
      return a.day_of_week - b.day_of_week;
    });
    
    // 承認状態でフィルタリング
    switch (filter) {
      case 'approved':
        return sortedSchedule.filter(item => item.approved);
      case 'pending':
        return sortedSchedule.filter(item => !item.approved);
      default:
        return sortedSchedule;
    }
  }, [schedule, filter]);
  
  // 承認済みと未承認のスケジュール数
  const approvedCount = useMemo(() => schedule.filter(item => item.approved).length, [schedule]);
  const pendingCount = useMemo(() => schedule.filter(item => !item.approved).length, [schedule]);

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✔️ スケジュール検証 ✔️</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-text mb-4">スケジュール概要</h3>
              <div className="space-y-2">
                <p className="text-text-light">総スケジュール数: <span className="font-bold">{schedule.length}</span></p>
                <p className="text-text-light">承認済み: <span className="font-bold text-green-600">{approvedCount}</span></p>
                <p className="text-text-light">未承認: <span className="font-bold text-yellow-600">{pendingCount}</span></p>
              </div>
            </div>

            <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-text mb-4">アクション</h3>
              <div className="space-y-4">
                <button
                  onClick={approveAllSchedule}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center"
                  disabled={pendingCount === 0}
                >
                  <FaCheck className="mr-2" /> すべてのスケジュールを承認
                </button>
                <Link href="/dashboard" className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center justify-center text-center">
                  ダッシュボードで確認
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
            <h3 className="text-xl font-bold text-text mb-4">フィルター</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                すべて ({schedule.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                承認済み ({approvedCount})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                未承認 ({pendingCount})
              </button>
            </div>
          </div>

          <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md">
            <h3 className="text-xl font-bold text-text mb-4">スケジュール一覧</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      曜日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      スケジュール名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      担当者
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedule.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className={item.approved ? 'bg-green-50' : 'bg-yellow-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.day}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.year}年度{item.semester === 'first' ? '前期' : '後期'}</div>
                          <div className="text-sm text-gray-500">{item.start_date} 〜 {item.end_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item.duties.map((duty, dutyIndex) => (
                              <div key={dutyIndex} className="mb-2">
                                <div className="font-medium">{duty.location}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {duty.members.map((member, memberIndex) => (
                                    <span key={memberIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {member.icon} {member.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.approved ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              承認済み
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              未承認
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {item.approved ? (
                            <button
                              onClick={() => rejectSchedule(item.id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              非承認
                            </button>
                          ) : (
                            <button
                              onClick={() => approveSchedule(item.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              承認
                            </button>
                          )}
                          <button
                            onClick={() => startEditing(item.id)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <FaEdit className="inline" /> 編集
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredSchedule.length === 0 && (
            <p className="text-center text-text-light py-4">表示するスケジュールがありません</p>
          )}
        </>
      )}

      {/* 編集フォーム */}
      {showForm && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">担当者の編集</h3>
            
            <div className="space-y-6 mb-6">
              {editingSchedule.duties.map((duty, dutyIndex) => (
                <div key={dutyIndex} className="border p-4 rounded-lg">
                  <h4 className="font-bold mb-2">{duty.location}</h4>
                  
                  <div className="space-y-3">
                    {duty.members.map((member, memberIndex) => (
                      <div key={memberIndex} className="flex items-center space-x-2">
                        <select
                          value={member.icon}
                          onChange={(e) => updateMember(dutyIndex, memberIndex, member.name, e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="🌸">🌸</option>
                          <option value="🚀">🚀</option>
                          <option value="📚">📚</option>
                          <option value="🌺">🌺</option>
                          <option value="🏃">🏃</option>
                          <option value="🌼">🌼</option>
                          <option value="🏆">🏆</option>
                          <option value="📖">📖</option>
                          <option value="🌻">🌻</option>
                          <option value="🌊">🌊</option>
                          <option value="🌷">🌷</option>
                          <option value="✈️">✈️</option>
                        </select>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(dutyIndex, memberIndex, e.target.value, member.icon)}
                          className="flex-1 px-4 py-2 border rounded-lg"
                          placeholder="担当者名"
                        />
                        <button
                          onClick={() => removeMember(dutyIndex, memberIndex)}
                          className="text-red-500 hover:text-red-700"
                          title="削除"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addMember(dutyIndex)}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      + 担当者を追加
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={saveEditing}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <FaSave className="inline mr-1" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
