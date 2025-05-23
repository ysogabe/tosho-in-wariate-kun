'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface CommitteeMember {
  id: number;
  name: string;
  role: string;
  class_id: number;
  class_name: string;
  grade_id: number;
  grade_name: string;
}

interface ClassData {
  id: number;
  name: string;
  grade_id: number;
  grade_name: string;
}

// Define the type for the object being edited, allowing for partial data, especially for new members
interface EditingMemberState {
  id?: number; // Optional for new members
  name: string;
  class_id: number | string; // Can be string from select, convert to number before sending
  role: string;
}


const API_MEMBERS_URL = 'http://localhost:5001/api/committee-members';
const API_CLASSES_URL = 'http://localhost:5001/api/classes';

export default function CommitteeMembersPage() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [editingMember, setEditingMember] = useState<EditingMemberState | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_MEMBERS_URL);
      if (!response.ok) throw new Error(`API Error (Members): ${response.status} ${response.statusText}`);
      const data: CommitteeMember[] = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '委員データの取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    // No separate loading state for classes, assume it's quick or part of overall loading
    try {
      const response = await fetch(API_CLASSES_URL);
      if (!response.ok) throw new Error(`API Error (Classes): ${response.status} ${response.statusText}`);
      const data: ClassData[] = await response.json();
      setAvailableClasses(data);
    } catch (err) {
      // Set a general error or a specific one for class fetching if needed
      setError(err instanceof Error ? err.message : 'クラスデータの取得に失敗しました。');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchClasses(); // Fetch classes when component mounts
  }, []);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name || !editingMember.class_id) {
      setFormError('名前とクラスを選択してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const method = editingMember.id ? 'PUT' : 'POST';
    const url = editingMember.id ? `${API_MEMBERS_URL}/${editingMember.id}` : API_MEMBERS_URL;
    
    const payload = {
      name: editingMember.name,
      class_id: Number(editingMember.class_id), // Ensure class_id is a number
      role: editingMember.role,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
      }
      await fetchMembers();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (member: CommitteeMember) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      class_id: member.class_id,
      role: member.role,
    });
    setFormError(null);
    setShowForm(true);
  };

  const startAddingNew = () => {
    setEditingMember({
      name: '',
      class_id: availableClasses.length > 0 ? availableClasses[0].id : '', // Default to first class or empty
      role: '委員', // Default role
    });
    setFormError(null);
    setShowForm(true);
  };

  const deleteMember = async (id: number) => {
    if (confirm('この委員を削除してもよろしいですか？')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_MEMBERS_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchMembers();
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormError(null);
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
            disabled={isLoading || availableClasses.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
            title={availableClasses.length === 0 ? "利用可能なクラスがありません" : "新規追加"}
          >
            <FaPlus className="mr-2" />
            新規追加
          </button>
        </div>
        
        {isLoading && members.length === 0 && <p className="text-center text-gray-500">データを読み込み中...</p>}
        {error && <p className="text-center text-red-500 my-4">エラー: {error}</p>}
        {!isLoading && !error && members.length === 0 && <p className="text-center text-gray-500">登録されている図書委員データがありません。</p>}

        {members.length > 0 && (
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
                    <td className="py-3 px-6 text-left">{member.grade_name}</td> {/* Display grade_name */}
                    <td className="py-3 px-6 text-left">{member.class_name}</td> {/* Display class_name */}
                    <td className="py-3 px-6 text-left">{member.role}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => startEditing(member)}
                          disabled={isLoading || availableClasses.length === 0}
                          className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2 disabled:opacity-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteMember(member.id)}
                          disabled={isLoading}
                          className="transform hover:text-red-500 hover:scale-110 transition-all mx-2 disabled:opacity-50"
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
        )}
      </div>

      {showForm && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingMember.id ? '委員を編集' : '新しい委員を追加'}
            </h2>
            <form onSubmit={handleSaveMember}>
              {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
              <div className="mb-4">
                <label htmlFor="memberName" className="block text-text-light mb-2">名前</label>
                <input
                  id="memberName"
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="名前を入力"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="memberClass" className="block text-text-light mb-2">クラス</label>
                <select
                  id="memberClass"
                  value={editingMember.class_id}
                  onChange={(e) => setEditingMember({ ...editingMember, class_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading || availableClasses.length === 0}
                >
                  {availableClasses.length === 0 && <option value="">クラスを読み込み中...</option>}
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.grade_name} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="memberRole" className="block text-text-light mb-2">役割</label>
                <select
                  id="memberRole"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                >
                  <option value="委員長">委員長</option>
                  <option value="副委員長">副委員長</option>
                  <option value="書記">書記</option>
                  <option value="会計">会計</option>
                  <option value="メンバー">メンバー</option> {/* Changed "委員" to "メンバー" to match seed data */}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading || availableClasses.length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
