'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Grade {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  gradeId: number;
  displayOrder: number;
}

export default function ClassesPage() {
  const [grades] = useState<Grade[]>([
    { id: 1, name: '1年' },
    { id: 2, name: '2年' },
    { id: 3, name: '3年' },
  ]);
  
  const [classes, setClasses] = useState<Class[]>([
    { id: 1, name: 'A組', gradeId: 1, displayOrder: 1 },
    { id: 2, name: 'B組', gradeId: 1, displayOrder: 2 },
    { id: 3, name: 'C組', gradeId: 1, displayOrder: 3 },
    { id: 4, name: 'A組', gradeId: 2, displayOrder: 1 },
    { id: 5, name: 'B組', gradeId: 2, displayOrder: 2 },
    { id: 6, name: 'C組', gradeId: 2, displayOrder: 3 },
    { id: 7, name: 'A組', gradeId: 3, displayOrder: 1 },
    { id: 8, name: 'B組', gradeId: 3, displayOrder: 2 },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<number>(0);
  const [newClassName, setNewClassName] = useState('');
  const [newGradeId, setNewGradeId] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState('');

  // フィルタリングされたクラスリスト
  const filteredClasses = selectedGradeId 
    ? classes.filter(c => c.gradeId === selectedGradeId)
    : classes;

  // 学年名を取得
  const getGradeName = (gradeId: number) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : '';
  };

  // モーダルを開く
  const openModal = (classItem: Class | null) => {
    setCurrentClass(classItem);
    if (classItem) {
      setNewClassName(classItem.name);
      setNewGradeId(classItem.gradeId.toString());
      setNewDisplayOrder(classItem.displayOrder.toString());
    } else {
      setNewClassName('');
      setNewGradeId(selectedGradeId ? selectedGradeId.toString() : '');
      setNewDisplayOrder('');
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentClass(null);
  };

  // クラスを保存
  const saveClass = () => {
    if (!newClassName.trim()) {
      alert('クラス名を入力してください');
      return;
    }

    if (!newGradeId) {
      alert('学年を選択してください');
      return;
    }

    const gradeId = parseInt(newGradeId);
    const order = parseInt(newDisplayOrder) || 0;

    if (currentClass) {
      // 既存のクラスを更新
      setClasses(classes.map(c => 
        c.id === currentClass.id 
          ? { ...c, name: newClassName, gradeId, displayOrder: order }
          : c
      ));
    } else {
      // 新しいクラスを追加
      const newId = Math.max(0, ...classes.map(c => c.id)) + 1;
      setClasses([...classes, { id: newId, name: newClassName, gradeId, displayOrder: order }]);
    }

    closeModal();
  };

  // クラスを削除
  const deleteClass = (id: number) => {
    if (confirm('本当に削除しますか？')) {
      setClasses(classes.filter(c => c.id !== id));
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
          <h2 className="text-2xl font-bold mb-6">クラス管理</h2>
          
          <div className="mb-6 flex justify-between items-center">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学年
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(parseInt(e.target.value) || 0)}
              >
                <option value={0}>全て</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              新規クラス登録
            </button>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラス名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所属学年
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    表示順
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getGradeName(classItem.gradeId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{classItem.displayOrder}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(classItem)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteClass(classItem.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* クラス登録/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentClass ? 'クラス編集' : '新規クラス登録'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  クラス名
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学年
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newGradeId}
                  onChange={(e) => setNewGradeId(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
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
                onClick={saveClass}
              >
                保存
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeModal}
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
