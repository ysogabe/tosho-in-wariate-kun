'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function GradesManagementPage() {
  const [grades, setGrades] = useState([
    { id: 1, name: '1年生', description: '小学1年生' },
    { id: 2, name: '2年生', description: '小学2年生' },
    { id: 3, name: '3年生', description: '小学3年生' },
    { id: 4, name: '4年生', description: '小学4年生' },
    { id: 5, name: '5年生', description: '小学5年生' },
    { id: 6, name: '6年生', description: '小学6年生' },
  ]);
  const [editingGrade, setEditingGrade] = useState<{ id: number, name: string, description: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 学年を追加または更新
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGrade) return;
    
    if (editingGrade.id) {
      // 既存の学年を更新
      setGrades(grades.map(grade => 
        grade.id === editingGrade.id ? editingGrade : grade
      ));
    } else {
      // 新しい学年を追加
      const newId = Math.max(0, ...grades.map(grade => grade.id)) + 1;
      setGrades([...grades, { ...editingGrade, id: newId }]);
    }
    
    setShowForm(false);
    setEditingGrade(null);
  };

  // 学年の編集を開始
  const startEditing = (grade: typeof grades[0]) => {
    setEditingGrade({ ...grade });
    setShowForm(true);
  };

  // 新しい学年の追加を開始
  const startAddingNew = () => {
    setEditingGrade({ id: 0, name: '', description: '' });
    setShowForm(true);
  };

  // 学年を削除
  const deleteGrade = (id: number) => {
    if (confirm('この学年を削除してもよろしいですか？')) {
      setGrades(grades.filter(grade => grade.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ 学年管理 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">学年一覧</h2>
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
                <th className="py-3 px-6 text-left">学年名</th>
                <th className="py-3 px-6 text-left">説明</th>
                <th className="py-3 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {grades.map((grade) => (
                <tr key={grade.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{grade.id}</td>
                  <td className="py-3 px-6 text-left">{grade.name}</td>
                  <td className="py-3 px-6 text-left">{grade.description}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <button
                        onClick={() => startEditing(grade)}
                        className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteGrade(grade.id)}
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

      {/* 学年編集フォーム */}
      {showForm && editingGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingGrade.id ? '学年を編集' : '新しい学年を追加'}
            </h2>
            <form onSubmit={handleSaveGrade}>
              <div className="mb-4">
                <label className="block text-text-light mb-2">学年名</label>
                <input
                  type="text"
                  value={editingGrade.name}
                  onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="学年名を入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">説明</label>
                <input
                  type="text"
                  value={editingGrade.description}
                  onChange={(e) => setEditingGrade({ ...editingGrade, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="説明を入力"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGrade(null);
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
