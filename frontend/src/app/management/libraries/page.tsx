'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { useSchool } from '../../../contexts/SchoolContext';

export default function LibrariesManagementPage() {
  const { schoolName, setSchoolName } = useSchool();
  const [name, setName] = useState(schoolName);
  const [libraries, setLibraries] = useState([
    { id: 1, name: '図書室A', capacity: 30, description: '主に低学年が利用する図書室です' },
    { id: 2, name: '図書室B', capacity: 25, description: '主に高学年が利用する図書室です' },
  ]);
  const [editingLibrary, setEditingLibrary] = useState<{ id: number, name: string, capacity: number, description: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 学校名を保存
  const saveSchoolName = () => {
    setSchoolName(name);
    setSuccessMessage('学校名が保存されました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 図書室を追加または更新
  const handleSaveLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLibrary) return;
    
    if (editingLibrary.id) {
      // 既存の図書室を更新
      setLibraries(libraries.map(lib => 
        lib.id === editingLibrary.id ? editingLibrary : lib
      ));
    } else {
      // 新しい図書室を追加
      const newId = Math.max(0, ...libraries.map(lib => lib.id)) + 1;
      setLibraries([...libraries, { ...editingLibrary, id: newId }]);
    }
    
    setShowForm(false);
    setEditingLibrary(null);
  };

  // 図書室の編集を開始
  const startEditing = (library: typeof libraries[0]) => {
    setEditingLibrary({ ...library });
    setShowForm(true);
  };

  // 新しい図書室の追加を開始
  const startAddingNew = () => {
    setEditingLibrary({ id: 0, name: '', capacity: 20, description: '' });
    setShowForm(true);
  };

  // 図書室を削除
  const deleteLibrary = (id: number) => {
    if (confirm('この図書室を削除してもよろしいですか？')) {
      setLibraries(libraries.filter(lib => lib.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ 図書室管理 ✨</h1>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}

      {/* 学校名設定セクション */}
      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <h2 className="text-2xl font-bold text-text mb-4">学校設定</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-text-light mb-2">学校名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="学校名を入力"
            />
          </div>
          <button
            onClick={saveSchoolName}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center mt-4 md:mt-8"
          >
            <FaSave className="mr-2" />
            保存
          </button>
        </div>
      </div>

      {/* 図書室一覧 */}
      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">図書室一覧</h2>
          <button
            onClick={startAddingNew}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
          >
            新規追加
          </button>
        </div>

        {libraries.length === 0 ? (
          <p className="text-text-light">図書室が登録されていません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {libraries.map((library) => (
              <div
                key={library.id}
                className="bg-white rounded-xl p-4 shadow border border-gray-100"
              >
                <h3 className="text-xl font-bold text-text">{library.name}</h3>
                <p className="text-text-light mb-2">定員: {library.capacity}人</p>
                <p className="text-text-light mb-4">{library.description}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => startEditing(library)}
                    className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteLibrary(library.id)}
                    className="px-4 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 図書室編集フォーム */}
      {showForm && editingLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingLibrary.id ? '図書室を編集' : '新しい図書室を追加'}
            </h2>
            <form onSubmit={handleSaveLibrary}>
              <div className="mb-4">
                <label className="block text-text-light mb-2">図書室名</label>
                <input
                  type="text"
                  value={editingLibrary.name}
                  onChange={(e) => setEditingLibrary({ ...editingLibrary, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="図書室名を入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">定員</label>
                <input
                  type="number"
                  value={editingLibrary.capacity}
                  onChange={(e) => setEditingLibrary({ ...editingLibrary, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="定員を入力"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-light mb-2">説明</label>
                <textarea
                  value={editingLibrary.description}
                  onChange={(e) => setEditingLibrary({ ...editingLibrary, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="説明を入力"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLibrary(null);
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
