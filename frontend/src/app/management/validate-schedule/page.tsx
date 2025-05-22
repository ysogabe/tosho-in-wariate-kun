'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaTimes, FaEdit, FaSave } from 'react-icons/fa';

export default function ValidateSchedulePage() {
  // 編集中のスケジュールの型定義
  type Member = { name: string; icon: string };
  type Duty = { location: string; members: Member[] };
  type ScheduleItem = {
    id: number;
    semester: string;
    year: string;
    day: string;
    duties: Duty[];
    approved: boolean;
  };
  type EditingSchedule = { id: number; duties: Duty[] };

  // スケジュールデータ - 曜日単位で図書委員を割り当て
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { 
      id: 1, 
      semester: '前期', // 前期・後期
      year: '2023', // 年度
      day: '月', 
      duties: [
        { location: '図書室A', members: [{ name: '山田花子', icon: '🌸' }, { name: '佐藤太郎', icon: '🚀' }] },
        { location: '図書室B', members: [{ name: '鈴木一郎', icon: '📚' }] }
      ],
      approved: true 
    },
    { 
      id: 2, 
      semester: '前期',
      year: '2023',
      day: '火', 
      duties: [
        { location: '図書室A', members: [{ name: '田中めぐみ', icon: '🌺' }, { name: '高橋健太', icon: '🏃' }] },
        { location: '図書室B', members: [{ name: '伊藤さくら', icon: '🌸' }] }
      ],
      approved: false 
    },
    { 
      id: 3, 
      semester: '前期',
      year: '2023',
      day: '水', 
      duties: [
        { location: '図書室A', members: [{ name: '渡辺結衣', icon: '🌼' }, { name: '小林大輔', icon: '🏆' }] },
        { location: '図書室B', members: [{ name: '加藤悠真', icon: '📖' }] }
      ],
      approved: false 
    },
    { 
      id: 4, 
      semester: '前期',
      year: '2023',
      day: '木', 
      duties: [
        { location: '図書室A', members: [{ name: '松本さやか', icon: '🌻' }, { name: '井上拓海', icon: '🌊' }] },
        { location: '図書室B', members: [{ name: '佐々木美咲', icon: '🌷' }] }
      ],
      approved: false 
    },
    { 
      id: 5, 
      semester: '前期',
      year: '2023',
      day: '金', 
      duties: [
        { location: '図書室A', members: [{ name: '山本航', icon: '✈️' }, { name: '中村あおい', icon: '🌊' }] },
        { location: '図書室B', members: [{ name: '斉藤健', icon: '🏃' }] }
      ],
      approved: false 
    },
  ]);

  const [editingSchedule, setEditingSchedule] = useState<EditingSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending'

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
        item.id === id ? { ...item, duties, approved: false } : item
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
    const scheduleToEdit = schedule.find(item => item.id === id);
    if (scheduleToEdit) {
      setEditingSchedule({ id, duties: JSON.parse(JSON.stringify(scheduleToEdit.duties)) });
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
      setEditingSchedule(null);
      setShowForm(false);
      setSuccessMessage('スケジュールが更新されました');
      setTimeout(() => setSuccessMessage(''), 3000);
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
    let filtered = [...schedule];
    
    // 承認状態でフィルタリング
    if (filter === 'approved') {
      filtered = filtered.filter(item => item.approved);
    } else if (filter === 'pending') {
      filtered = filtered.filter(item => !item.approved);
    }
    
    // 曜日順にソート
    const dayOrder = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6 };
    filtered.sort((a, b) => {
      // まず年度でソート
      if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
      
      // 次に学期でソート（前期→後期）
      if (a.semester !== b.semester) {
        return a.semester === '前期' ? -1 : 1;
      }
      
      // 最後に曜日でソート
      return dayOrder[a.day as keyof typeof dayOrder] - dayOrder[b.day as keyof typeof dayOrder];
    });
    
    return filtered;
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
        <h1 className="text-3xl font-bold text-text">✨ スケジュール検証 ✨</h1>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
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
            <Link href="/dashboard" className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center justify-center inline-block text-center">
              ダッシュボードで確認
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-6">スケジュール一覧</h2>
          
          <div className="mb-6 flex items-center space-x-4">
            <span className="text-text-light">フィルター:</span>
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-primary text-white' : 'bg-white text-text-light'}`}
            >
              すべて
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-full ${filter === 'approved' ? 'bg-primary text-white' : 'bg-white text-text-light'}`}
            >
              承認済み
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-primary text-white' : 'bg-white text-text-light'}`}
            >
              未承認
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">曜日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">図書室</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchedule.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.duties.map((duty, dutyIndex) => (
                      <tr key={`${item.id}-${dutyIndex}`} className={item.approved ? 'bg-green-50' : 'bg-yellow-50'}>
                        {dutyIndex === 0 && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={item.duties.length}>{item.year}年度</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={item.duties.length}>{item.semester}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={item.duties.length}>{item.day}曜日</td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{duty.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {duty.members.map((member, idx) => (
                            <div key={idx} className="flex items-center mb-1">
                              <span className="text-xl mr-2" role="img" aria-label="member icon">{member.icon}</span>
                              <span>{member.name}</span>
                            </div>
                          ))}
                        </td>
                        {dutyIndex === 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm" rowSpan={item.duties.length}>
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
                        )}
                        {dutyIndex === 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2" rowSpan={item.duties.length}>
                            {!item.approved && (
                              <button
                                onClick={() => approveSchedule(item.id)}
                                className="text-green-600 hover:text-green-900"
                                title="承認"
                              >
                                <FaCheck />
                              </button>
                            )}
                            {item.approved && (
                              <button
                                onClick={() => rejectSchedule(item.id)}
                                className="text-red-600 hover:text-red-900"
                                title="非承認"
                              >
                                <FaTimes />
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(item.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="編集"
                            >
                              <FaEdit />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSchedule.length === 0 && (
          <p className="text-center text-text-light py-4">表示するスケジュールがありません</p>
        )}
      </div>

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
