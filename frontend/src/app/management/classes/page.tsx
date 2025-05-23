'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface ClassData {
  id: number;
  name: string;
  grade_id: number;
  grade_name: string;
}

interface Grade {
  id: number;
  name: string;
  description: string;
}

interface EditingClassState {
  id?: number; // Optional for new classes
  name: string;
  grade_id: number | string; // Can be string from select, convert to number before sending
}

const API_CLASSES_URL = 'http://localhost:5001/api/classes';
const API_GRADES_URL = 'http://localhost:5001/api/grades';


export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [editingClass, setEditingClass] = useState<EditingClassState | null>(null);
  const [availableGrades, setAvailableGrades] = useState<Grade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);


  const fetchClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_CLASSES_URL);
      if (!response.ok) throw new Error(`API Error (Classes): ${response.status} ${response.statusText}`);
      const data: ClassData[] = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クラスデータの取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    // No separate loading state for grades, assume it's quick or part of overall loading
    try {
      const response = await fetch(API_GRADES_URL);
      if (!response.ok) throw new Error(`API Error (Grades): ${response.status} ${response.statusText}`);
      const data: Grade[] = await response.json();
      setAvailableGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '学年データの取得に失敗しました。');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchGrades();
  }, []);

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name || !editingClass.grade_id) {
      setFormError('クラス名と学年を選択してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const method = editingClass.id ? 'PUT' : 'POST';
    const url = editingClass.id ? `${API_CLASSES_URL}/${editingClass.id}` : API_CLASSES_URL;
    
    const payload = {
      name: editingClass.name,
      grade_id: Number(editingClass.grade_id), // Ensure grade_id is a number
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
      await fetchClasses();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (cls: ClassData) => {
    setEditingClass({
      id: cls.id,
      name: cls.name,
      grade_id: cls.grade_id,
    });
    setFormError(null);
    setShowForm(true);
  };

  const startAddingNew = () => {
    setEditingClass({
      name: '',
      grade_id: availableGrades.length > 0 ? availableGrades[0].id : '', // Default to first grade or empty
    });
    setFormError(null);
    setShowForm(true);
  };

  const deleteClass = async (id: number) => {
    if (confirm('このクラスを削除してもよろしいですか？関連する委員や割り当てがある場合は削除できません。')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_CLASSES_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchClasses();
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
    setEditingClass(null);
    setFormError(null);
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
            disabled={isLoading || availableGrades.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
            title={availableGrades.length === 0 ? "利用可能な学年がありません" : "新規追加"}
          >
            <FaPlus className="mr-2" />
            新規追加
          </button>
        </div>

        {isLoading && classes.length === 0 && <p className="text-center text-gray-500">データを読み込み中...</p>}
        {error && <p className="text-center text-red-500 my-4">エラー: {error}</p>}
        {!isLoading && !error && classes.length === 0 && <p className="text-center text-gray-500">登録されているクラスデータがありません。</p>}

        {classes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">ID</th>
                  <th className="py-3 px-6 text-left">クラス名</th>
                  <th className="py-3 px-6 text-left">学年</th>
                  {/* <th className="py-3 px-6 text-left">定員</th> Backend doesn't support capacity for classes table */}
                  <th className="py-3 px-6 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">{cls.id}</td>
                    <td className="py-3 px-6 text-left">{cls.name}</td>
                    <td className="py-3 px-6 text-left">{cls.grade_name}</td>
                    {/* <td className="py-3 px-6 text-left">{cls.capacity}人</td> */}
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => startEditing(cls)}
                          disabled={isLoading || availableGrades.length === 0}
                          className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2 disabled:opacity-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteClass(cls.id)}
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

      {showForm && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingClass.id ? 'クラスを編集' : '新しいクラスを追加'}
            </h2>
            <form onSubmit={handleSaveClass}>
              {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
              <div className="mb-4">
                <label htmlFor="className" className="block text-text-light mb-2">クラス名</label>
                <input
                  id="className"
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="クラス名を入力 (例: 1組)"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="classGrade" className="block text-text-light mb-2">学年</label>
                <select
                  id="classGrade"
                  value={editingClass.grade_id}
                  onChange={(e) => setEditingClass({ ...editingClass, grade_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading || availableGrades.length === 0}
                >
                  {availableGrades.length === 0 && <option value="">学年を読み込み中...</option>}
                  {availableGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Capacity field removed as it's not in the backend 'classes' table schema */}
              <div className="flex justify-end space-x-2 mt-6">
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
                  disabled={isLoading || availableGrades.length === 0}
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
