'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Rule {
  id: number;
  name: string;
  description: string;
  type: 'required' | 'preferred' | 'forbidden';
  priority: number;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([
    { 
      id: 1, 
      name: '同一人物の連続当番禁止', 
      description: '同じ人が連続して当番に入らないようにする', 
      type: 'forbidden', 
      priority: 1 
    },
    { 
      id: 2, 
      name: '学年バランス', 
      description: '各当番に異なる学年の生徒を配置する', 
      type: 'preferred', 
      priority: 2 
    },
    { 
      id: 3, 
      name: '必要人数確保', 
      description: '各図書室に必要な人数を配置する', 
      type: 'required', 
      priority: 3 
    },
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'required' | 'preferred' | 'forbidden'>('required');
  const [newPriority, setNewPriority] = useState('');

  // モーダルを開く
  const openModal = (rule: Rule | null) => {
    setCurrentRule(rule);
    if (rule) {
      setNewName(rule.name);
      setNewDescription(rule.description);
      setNewType(rule.type);
      setNewPriority(rule.priority.toString());
    } else {
      setNewName('');
      setNewDescription('');
      setNewType('required');
      setNewPriority('');
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRule(null);
  };

  // ルールを保存
  const saveRule = () => {
    if (!newName.trim()) {
      alert('ルール名を入力してください');
      return;
    }

    if (!newDescription.trim()) {
      alert('説明を入力してください');
      return;
    }

    const priority = parseInt(newPriority) || 0;

    if (currentRule) {
      // 既存のルールを更新
      setRules(rules.map(r => 
        r.id === currentRule.id 
          ? { 
              ...r, 
              name: newName, 
              description: newDescription, 
              type: newType,
              priority: priority
            }
          : r
      ));
    } else {
      // 新しいルールを追加
      const newId = Math.max(0, ...rules.map(r => r.id)) + 1;
      setRules([
        ...rules, 
        { 
          id: newId, 
          name: newName, 
          description: newDescription, 
          type: newType,
          priority: priority
        }
      ]);
    }

    closeModal();
  };

  // ルールを削除
  const deleteRule = (id: number) => {
    if (confirm('本当に削除しますか？')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  // ルールタイプの表示名
  const getRuleTypeName = (type: string) => {
    switch (type) {
      case 'required': return '必須';
      case 'preferred': return '優先';
      case 'forbidden': return '禁止';
      default: return type;
    }
  };

  // ルールタイプに応じたバッジの色
  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'required': return 'bg-blue-100 text-blue-800';
      case 'preferred': return 'bg-green-100 text-green-800';
      case 'forbidden': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src="/images/books-icon.png" alt="本のアイコン" className="h-8 w-8 mr-2" />
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
          <h2 className="text-2xl font-bold mb-6">スケジュールルール設定</h2>
          
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => openModal(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              新規ルール登録
            </button>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ルール名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ルールタイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{rule.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRuleTypeColor(rule.type)}`}>
                        {getRuleTypeName(rule.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.priority}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(rule)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
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

      {/* ルール登録/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentRule ? 'ルール編集' : '新規ルール登録'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ルール名
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
                  説明
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ルールタイプ
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="required"
                      name="ruleType"
                      type="radio"
                      checked={newType === 'required'}
                      onChange={() => setNewType('required')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                      必須（必ず満たす必要がある）
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="preferred"
                      name="ruleType"
                      type="radio"
                      checked={newType === 'preferred'}
                      onChange={() => setNewType('preferred')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="preferred" className="ml-2 block text-sm text-gray-900">
                      優先（可能な限り満たす）
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="forbidden"
                      name="ruleType"
                      type="radio"
                      checked={newType === 'forbidden'}
                      onChange={() => setNewType('forbidden')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="forbidden" className="ml-2 block text-sm text-gray-900">
                      禁止（絶対に満たしてはいけない）
                    </label>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優先度
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">数値が大きいほど優先度が高くなります</p>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={saveRule}
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
