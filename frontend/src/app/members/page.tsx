'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 型定義
interface Member {
  id: number;
  name: string;
  grade: string;
  className: string;
  role: string;
  active: boolean;
  notes?: string;
}

// モックデータ
const mockMembers: Member[] = [
  { id: 1, name: '山田太郎', grade: '1年', className: 'A組', role: '委員長', active: true },
  { id: 2, name: '佐藤花子', grade: '1年', className: 'B組', role: '副委員長', active: true },
  { id: 3, name: '鈴木一郎', grade: '2年', className: 'A組', role: '委員', active: true },
  { id: 4, name: '高橋明', grade: '2年', className: 'C組', role: '委員', active: true },
  { id: 5, name: '渡辺健太', grade: '3年', className: 'B組', role: '委員', active: true },
  { id: 6, name: '中村さくら', grade: '3年', className: 'A組', role: '委員', active: false },
];

const mockGrades = ['1年', '2年', '3年'];
const mockClasses = ['A組', 'B組', 'C組'];
const mockRoles = ['委員長', '副委員長', '委員'];

export default function MembersManagement() {
  const [members, setMembers] = useState(mockMembers);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    id: 0,
    name: '',
    grade: '',
    className: '',
    role: '',
    active: true,
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // フィルタリングされた図書委員リスト
  const filteredMembers = members.filter(member => {
    if (selectedGrade && member.grade !== selectedGrade) return false;
    if (selectedClass && member.className !== selectedClass) return false;
    return true;
  });

  // モーダルを開く（新規登録）
  const openAddModal = () => {
    setCurrentMember({
      id: members.length + 1,
      name: '',
      grade: '',
      className: '',
      role: '',
      active: true,
      notes: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // モーダルを開く（編集）
  const openEditModal = (member: Member) => {
    setCurrentMember({
      ...member,
      notes: ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 図書委員の保存処理
  const saveMember = () => {
    if (isEditing) {
      // 既存の図書委員を更新
      setMembers(members.map(member => 
        member.id === currentMember.id ? currentMember : member
      ));
    } else {
      // 新規図書委員を追加
      setMembers([...members, currentMember]);
    }
    closeModal();
  };

  // 図書委員の削除処理
  const deleteMember = (id: number) => {
    if (confirm('本当に削除しますか？')) {
      setMembers(members.filter(member => member.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 relative mr-2">
              <Image 
                src="/images/books-icon.png" 
                alt="本のアイコン"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800">図書当番割り当てくん</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">管理者さん</span>
            <Link href="/dashboard">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors">
                ダッシュボードへ戻る
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-grow bg-gray-50 p-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">図書委員管理</h2>

          {/* フィルターと新規登録ボタン */}
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="gradeFilter" className="block text-sm font-medium text-gray-700 mb-1">学年</label>
                  <select
                    id="gradeFilter"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">全て</option>
                    {mockGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700 mb-1">クラス</label>
                  <select
                    id="classFilter"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">全て</option>
                    {mockClasses.map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                新規図書委員登録
              </button>
            </div>
          </div>

          {/* 図書委員一覧テーブル */}
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役職
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.grade} {member.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {member.active ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => openEditModal(member)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => deleteMember(member.id)}
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

      {/* フッター */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center">
          <p>© 2025 図書当番割り当てくん</p>
        </div>
      </footer>

      {/* 図書委員登録/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '図書委員編集' : '新規図書委員登録'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
                  <input
                    type="text"
                    id="name"
                    value={currentMember.name}
                    onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例：山田太郎"
                  />
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">学年</label>
                  <select
                    id="grade"
                    value={currentMember.grade}
                    onChange={(e) => setCurrentMember({...currentMember, grade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    {mockGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">クラス</label>
                  <select
                    id="className"
                    value={currentMember.className}
                    onChange={(e) => setCurrentMember({...currentMember, className: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    {mockClasses.map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                  <select
                    id="role"
                    value={currentMember.role}
                    onChange={(e) => setCurrentMember({...currentMember, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    {mockRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={currentMember.active}
                    onChange={(e) => setCurrentMember({...currentMember, active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    アクティブ
                  </label>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                  <textarea
                    id="notes"
                    value={currentMember.notes}
                    onChange={(e) => setCurrentMember({...currentMember, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="備考があれば入力してください"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
