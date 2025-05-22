'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState([
    { id: 1, name: '1年1組', gradeId: 1, capacity: 30 },
    { id: 2, name: '1年2組', gradeId: 1, capacity: 28 },
    { id: 3, name: '2年1組', gradeId: 2, capacity: 32 },
    { id: 4, name: '2年2組', gradeId: 2, capacity: 30 },
  ]);
  const [editingClass, setEditingClass] = useState<{ id: number, name: string, gradeId: number, capacity: number } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // クラスを追加または更新
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingClass) return;
    
    if (editingClass.id) {
      // 既存のクラスを更新
      setClasses(classes.map(cls => 
        cls.id === editingClass.id ? editingClass : cls
      ));
    } else {
      // 新しいクラスを追加
      const newId = Math.max(0, ...classes.map(cls => cls.id)) + 1;
      setClasses([...classes, { ...editingClass, id: newId }]);
    }
    
    setShowForm(false);
    setEditingClass(null);
  };

  // クラスの編集を開始
  const startEditing = (cls: typeof classes[0]) => {
    setEditingClass({ ...cls });
    setShowForm(true);
  };

  // 新しいクラスの追加を開始
  const startAddingNew = () => {
    setEditingClass({ id: 0, name: '', gradeId: 1, capacity: 30 });
    setShowForm(true);
  };

  // クラスを削除
  const deleteClass = (id: number) => {
    if (confirm('このクラスを削除してもよろしいですか？')) {
      setClasses(classes.filter(cls => cls.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ クラス管理 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">クラス一覧</h2>
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
                <th className="py-3 px-6 text-left">クラス名</th>
                <th className="py-3 px-6 text-left">学年ID</th>
                <th className="py-3 px-6 text-left">定員</th>
                <th className="py-3 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{cls.id}</td>
                  <td className="py-3 px-6 text-left">{cls.name}</td>
                  <td className="py-3 px-6 text-left">{cls.gradeId}</td>
                  <td className="py-3 px-6 text-left">{cls.capacity}人</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <button
                        onClick={() => startEditing(cls)}
                        className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteClass(cls.id)}
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

      {/* クラス編集フォーム */}
      {showForm && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingClass.id ? 'クラスを編集' : '新しいクラスを追加'}
            </h2>
            <form onSubmit={handleSaveClass}>
              <div className="mb-4">
                <label className="block text-text-light mb-2">クラス名</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="クラス名を入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">学年ID</label>
                <select
                  value={editingClass.gradeId}
                  onChange={(e) => setEditingClass({ ...editingClass, gradeId: parseInt(e.target.value) })}
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
                <label className="block text-text-light mb-2">定員</label>
                <input
                  type="number"
                  value={editingClass.capacity}
                  onChange={(e) => setEditingClass({ ...editingClass, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="定員を入力"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClass(null);
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
