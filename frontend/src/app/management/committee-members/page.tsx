'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function CommitteeMembersPage() {
  const [members, setMembers] = useState([
    { id: 1, name: '山田花子', grade: 5, className: '5年1組', role: '委員長' },
    { id: 2, name: '佐藤太郎', grade: 5, className: '5年2組', role: '副委員長' },
    { id: 3, name: '鈴木一郎', grade: 4, className: '4年1組', role: '委員' },
    { id: 4, name: '田中めぐみ', grade: 4, className: '4年2組', role: '委員' },
    { id: 5, name: '高橋健太', grade: 3, className: '3年1組', role: '委員' },
    { id: 6, name: '伊藤さくら', grade: 3, className: '3年2組', role: '委員' },
  ]);
  const [editingMember, setEditingMember] = useState<{ id: number, name: string, grade: number, className: string, role: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 委員を追加または更新
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    if (editingMember.id) {
      // 既存の委員を更新
      setMembers(members.map(member => 
        member.id === editingMember.id ? editingMember : member
      ));
    } else {
      // 新しい委員を追加
      const newId = Math.max(0, ...members.map(member => member.id)) + 1;
      setMembers([...members, { ...editingMember, id: newId }]);
    }
    
    setShowForm(false);
    setEditingMember(null);
  };

  // 委員の編集を開始
  const startEditing = (member: typeof members[0]) => {
    setEditingMember({ ...member });
    setShowForm(true);
  };

  // 新しい委員の追加を開始
  const startAddingNew = () => {
    setEditingMember({ id: 0, name: '', grade: 3, className: '3年1組', role: '委員' });
    setShowForm(true);
  };

  // 委員を削除
  const deleteMember = (id: number) => {
    if (confirm('この委員を削除してもよろしいですか？')) {
      setMembers(members.filter(member => member.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ 図書委員管理 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">図書委員一覧</h2>
          <button
            onClick={startAddingNew}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            新規追加
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">名前</th>
                <th className="py-3 px-6 text-left">学年</th>
                <th className="py-3 px-6 text-left">クラス</th>
                <th className="py-3 px-6 text-left">役割</th>
                <th className="py-3 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{member.id}</td>
                  <td className="py-3 px-6 text-left">{member.name}</td>
                  <td className="py-3 px-6 text-left">{member.grade}年生</td>
                  <td className="py-3 px-6 text-left">{member.className}</td>
                  <td className="py-3 px-6 text-left">{member.role}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <button
                        onClick={() => startEditing(member)}
                        className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="transform hover:text-red-500 hover:scale-110 transition-all mx-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 委員編集フォーム */}
      {showForm && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingMember.id ? '委員を編集' : '新しい委員を追加'}
            </h2>
            <form onSubmit={handleSaveMember}>
              <div className="mb-4">
                <label className="block text-text-light mb-2">名前</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="名前を入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">学年</label>
                <select
                  value={editingMember.grade}
                  onChange={(e) => setEditingMember({ ...editingMember, grade: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value={1}>1年生</option>
                  <option value={2}>2年生</option>
                  <option value={3}>3年生</option>
                  <option value={4}>4年生</option>
                  <option value={5}>5年生</option>
                  <option value={6}>6年生</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">クラス</label>
                <input
                  type="text"
                  value={editingMember.className}
                  onChange={(e) => setEditingMember({ ...editingMember, className: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="クラスを入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">役割</label>
                <select
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="委員長">委員長</option>
                  <option value="副委員長">副委員長</option>
                  <option value="委員">委員</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMember(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
