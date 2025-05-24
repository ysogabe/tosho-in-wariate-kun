'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Library {
  id: number;
  name: string;
  location: string;
  requiredPeople: number;
  isActive: boolean;
  notes?: string;
}

export default function LibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([
    { id: 1, name: '図書室A', location: '本館1階', requiredPeople: 2, isActive: true },
    { id: 2, name: '図書室B', location: '新館2階', requiredPeople: 2, isActive: true },
    { id: 3, name: '図書室C', location: '別館', requiredPeople: 1, isActive: false, notes: '現在改装中' },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLibrary, setCurrentLibrary] = useState<Library | null>(null);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRequiredPeople, setNewRequiredPeople] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  // モーダルを開く
  const openModal = (library: Library | null) => {
    setCurrentLibrary(library);
    if (library) {
      setNewName(library.name);
      setNewLocation(library.location);
      setNewRequiredPeople(library.requiredPeople.toString());
      setNewIsActive(library.isActive);
      setNewNotes(library.notes || '');
    } else {
      setNewName('');
      setNewLocation('');
      setNewRequiredPeople('');
      setNewIsActive(true);
      setNewNotes('');
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLibrary(null);
  };

  // 図書室を保存
  const saveLibrary = () => {
    if (!newName.trim()) {
      alert('図書室名を入力してください');
      return;
    }

    if (!newLocation.trim()) {
      alert('場所を入力してください');
      return;
    }

    const requiredPeople = parseInt(newRequiredPeople);
    if (isNaN(requiredPeople) || requiredPeople < 1) {
      alert('必要人数は1以上の整数を入力してください');
      return;
    }

    if (currentLibrary) {
      // 既存の図書室を更新
      setLibraries(libraries.map(lib => 
        lib.id === currentLibrary.id 
          ? { 
              ...lib, 
              name: newName, 
              location: newLocation, 
              requiredPeople: requiredPeople,
              isActive: newIsActive,
              notes: newNotes || undefined
            }
          : lib
      ));
    } else {
      // 新しい図書室を追加
      const newId = Math.max(0, ...libraries.map(lib => lib.id)) + 1;
      setLibraries([
        ...libraries, 
        { 
          id: newId, 
          name: newName, 
          location: newLocation, 
          requiredPeople: requiredPeople,
          isActive: newIsActive,
          notes: newNotes || undefined
        }
      ]);
    }

    closeModal();
  };

  // 図書室を削除
  const deleteLibrary = (id: number) => {
    if (confirm('本当に削除しますか？')) {
      setLibraries(libraries.filter(lib => lib.id !== id));
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
          <h2 className="text-2xl font-bold mb-6">図書室管理</h2>
          
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => openModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              新規図書室登録
            </button>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    図書室名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    必要人数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {libraries.map((library) => (
                  <tr key={library.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{library.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{library.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{library.requiredPeople}人</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        library.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {library.isActive ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(library)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteLibrary(library.id)}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        削除
                      </button>
                      <Link href={`/libraries/time-settings/${library.id}`}>
                        <button className="text-blue-600 hover:text-blue-900">
                          利用時間設定
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 図書室登録/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentLibrary ? '図書室編集' : '新規図書室登録'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  図書室名
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  必要人数
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newRequiredPeople}
                  onChange={(e) => setNewRequiredPeople(e.target.value)}
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  アクティブ
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={saveLibrary}
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
