'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gradesApi, Grade as GradeType } from '@/services/api';

interface Grade extends GradeType {
  displayOrder?: number;
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [newGradeName, setNewGradeName] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch grades from API
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const data = await gradesApi.getAll();
        // Sort grades by ID for now (backend doesn't have displayOrder)
        const sortedGrades = data.map(grade => ({
          ...grade,
          displayOrder: grade.id // Use ID as displayOrder for now
        }));
        setGrades(sortedGrades);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch grades:', err);
        setError('Failed to load grades. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGrades();
  }, []);

  // フィルタリングされた学年リスト
  const filteredGrades = grades.filter(grade => 
    grade.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // モーダルを開く
  const openModal = (grade: Grade | null) => {
    setCurrentGrade(grade);
    if (grade) {
      setNewGradeName(grade.name);
      setNewDisplayOrder(grade.displayOrder?.toString() || '0');
    } else {
      setNewGradeName('');
      setNewDisplayOrder('');
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentGrade(null);
  };

  // 学年を保存
  const saveGrade = async () => {
    if (!newGradeName.trim()) {
      alert('学年名を入力してください');
      return;
    }

    const order = parseInt(newDisplayOrder) || 0;
    setIsLoading(true);

    try {
      if (currentGrade) {
        // 既存の学年を更新
        const updatedGrade = await gradesApi.update(currentGrade.id, { 
          name: newGradeName,
          description: `表示順: ${order}` // Store displayOrder in description for now
        });
        
        setGrades(grades.map(g => 
          g.id === currentGrade.id 
            ? { ...updatedGrade, displayOrder: order }
            : g
        ));
      } else {
        // 新しい学年を追加
        const newGrade = await gradesApi.create({ 
          name: newGradeName,
          description: `表示順: ${order}` // Store displayOrder in description for now
        });
        
        setGrades([...grades, { ...newGrade, displayOrder: order }]);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save grade:', err);
      alert('学年の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 学年を削除
  const deleteGrade = async (id: number) => {
    if (confirm('本当に削除しますか？')) {
      try {
        setIsLoading(true);
        await gradesApi.delete(id);
        setGrades(grades.filter(g => g.id !== id));
      } catch (err) {
        console.error('Failed to delete grade:', err);
        alert('学年の削除に失敗しました。もう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Image 
              src="/book-icon.svg" 
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
          <h2 className="text-2xl font-bold mb-6">学年管理</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          <div className="mb-6 flex justify-between items-center">
            <div className="w-1/3">
              <input
                type="text"
                placeholder="学年名で検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => openModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              disabled={isLoading}
            >
              新規学年登録
            </button>
          </div>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">学年名</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">表示順</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      データを読み込み中...
                    </td>
                  </tr>
                ) : filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? '検索結果がありません' : '学年が登録されていません'}
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{grade.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grade.displayOrder}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(grade)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          disabled={isLoading}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteGrade(grade.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 学年登録/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentGrade ? '学年編集' : '新規学年登録'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学年名
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示順
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newDisplayOrder}
                  onChange={(e) => setNewDisplayOrder(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={saveGrade}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeModal}
                disabled={isLoading}
              >
                キャンセル
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
