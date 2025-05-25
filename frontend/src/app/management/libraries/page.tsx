'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaPlus, FaEdit, FaTrash, FaRegCalendarAlt } from 'react-icons/fa';
import { useSchool } from '../../../contexts/SchoolContext'; // Assuming this context is still relevant for school name

interface LibraryAvailabilitySlot {
  id?: number; // Optional for new slots, backend might generate it
  day_of_week: number; // 0 for Sunday, 1 for Monday, etc.
  open_time: string; // HH:MM
  close_time: string; // HH:MM
}

interface Library {
  id: number;
  name: string;
  location: string;
  capacity: number | null; // Can be null
  is_active: boolean;
  availability: LibraryAvailabilitySlot[];
}

interface EditingLibraryState {
  id?: number;
  name: string;
  location: string;
  capacity: string; // Keep as string for form input, convert on save
  is_active: boolean;
  availability: LibraryAvailabilitySlot[];
}

const API_LIBRARIES_URL = 'http://localhost:5001/api/libraries';
const daysOfWeekMap = ["日", "月", "火", "水", "木", "金", "土"];


export default function LibrariesManagementPage() {
  const { schoolName, setSchoolName } = useSchool(); // School name part remains
  const [currentSchoolNameDisplay, setCurrentSchoolNameDisplay] = useState(schoolName); // For display in input
  const [successMessage, setSuccessMessage] = useState('');


  const [libraries, setLibraries] = useState<Library[]>([]);
  const [editingLibrary, setEditingLibrary] = useState<EditingLibraryState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch libraries
  const fetchLibraries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_LIBRARIES_URL);
      if (!response.ok) throw new Error(`API Error (Libraries): ${response.status} ${response.statusText}`);
      const data: Library[] = await response.json();
      setLibraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '図書室データの取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);
  
  useEffect(() => { // Sync local state if context changes
    setCurrentSchoolNameDisplay(schoolName);
  }, [schoolName]);


  // School name save (existing logic)
  const saveSchoolName = () => {
    setSchoolName(currentSchoolNameDisplay); // Update context
    setSuccessMessage('学校名が保存されました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLibrary || !editingLibrary.name) {
      setFormError('図書室名を入力してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const method = editingLibrary.id ? 'PUT' : 'POST';
    const url = editingLibrary.id ? `${API_LIBRARIES_URL}/${editingLibrary.id}` : API_LIBRARIES_URL;
    
    const payload = {
      ...editingLibrary,
      capacity: editingLibrary.capacity === '' ? null : Number(editingLibrary.capacity), // Convert capacity to number or null
      // Ensure availability slots are valid (e.g. times are set if day_of_week is set)
      // This might need more robust validation depending on requirements
      availability: editingLibrary.availability.filter(a => a.open_time && a.close_time).map(a => ({
        day_of_week: Number(a.day_of_week),
        open_time: a.open_time,
        close_time: a.close_time,
        // id is not sent for new availabilities, backend should handle it
        ...(a.id && method === 'PUT' && { id: a.id }) // include id only for existing slots during PUT
      }))
    };
    if (!editingLibrary.id) { // For POST (new library)
      delete payload.id; // Remove undefined id from payload
    }


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
      await fetchLibraries();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (library: Library) => {
    setEditingLibrary({
      ...library,
      capacity: library.capacity === null ? '' : String(library.capacity), // Handle null capacity
      availability: library.availability.map(a => ({...a})) // Deep copy availability
    });
    setFormError(null);
    setShowForm(true);
  };

  const startAddingNew = () => {
    setEditingLibrary({
      name: '',
      location: '',
      capacity: '',
      is_active: true,
      availability: [],
    });
    setFormError(null);
    setShowForm(true);
  };

  const deleteLibrary = async (id: number) => {
    if (confirm('この図書室を削除してもよろしいですか？関連するスケジュール割り当てがある場合は削除できないことがあります。')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_LIBRARIES_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchLibraries();
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
    setEditingLibrary(null);
    setFormError(null);
  };

  // Availability form handlers
  const handleAvailabilityChange = (index: number, field: keyof LibraryAvailabilitySlot, value: string | number) => {
    if (!editingLibrary) return;
    const updatedAvailability = [...editingLibrary.availability];
    updatedAvailability[index] = { ...updatedAvailability[index], [field]: value };
    setEditingLibrary({ ...editingLibrary, availability: updatedAvailability });
  };

  const addAvailabilitySlot = () => {
    if (!editingLibrary) return;
    setEditingLibrary({
      ...editingLibrary,
      availability: [...editingLibrary.availability, { day_of_week: 1, open_time: '', close_time: '' }],
    });
  };

  const removeAvailabilitySlot = (index: number) => {
    if (!editingLibrary) return;
    const updatedAvailability = editingLibrary.availability.filter((_, i) => i !== index);
    setEditingLibrary({ ...editingLibrary, availability: updatedAvailability });
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 transition-opacity duration-300">
          {successMessage}
        </div>
      )}

      {/* 学校名設定セクション - existing logic */}
      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <h2 className="text-2xl font-bold text-text mb-4">学校設定</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-full md:w-1/2">
            <label htmlFor="schoolNameInput" className="block text-text-light mb-2">学校名</label>
            <input
              id="schoolNameInput"
              type="text"
              value={currentSchoolNameDisplay}
              onChange={(e) => setCurrentSchoolNameDisplay(e.target.value)}
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
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
          >
            <FaPlus className="mr-2" />
            新規追加
          </button>
        </div>

        {isLoading && libraries.length === 0 && <p className="text-center text-gray-500">データを読み込み中...</p>}
        {error && <p className="text-center text-red-500 my-4">エラー: {error}</p>}
        {!isLoading && !error && libraries.length === 0 && <p className="text-center text-gray-500">登録されている図書室データがありません。</p>}

        {libraries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {libraries.map((library) => (
              <div
                key={library.id}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-primary mb-2">{library.name}</h3>
                <p className="text-text-light mb-1"><strong className="font-medium">場所:</strong> {library.location || '未設定'}</p>
                <p className="text-text-light mb-1"><strong className="font-medium">定員:</strong> {library.capacity ?? '未設定'}人</p>
                <p className="text-text-light mb-3">
                  <strong className="font-medium">状態:</strong> 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${library.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {library.is_active ? '開館中' : '閉館中'}
                  </span>
                </p>
                <div className="mb-3">
                  <strong className="font-medium text-text-light flex items-center mb-1"><FaRegCalendarAlt className="mr-2 text-secondary"/>利用可能時間:</strong>
                  {library.availability.length > 0 ? (
                    <ul className="list-disc list-inside pl-1 space-y-0.5 text-sm">
                      {library.availability.sort((a,b) => a.day_of_week - b.day_of_week).map(avail => (
                        <li key={avail.id || `${avail.day_of_week}-${avail.open_time}`}>
                          {daysOfWeekMap[avail.day_of_week]}: {avail.open_time} - {avail.close_time}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 pl-1">未設定</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => startEditing(library)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <FaEdit className="mr-1"/>編集
                  </button>
                  <button
                    onClick={() => deleteLibrary(library.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <FaTrash className="mr-1"/>削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && editingLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-text mb-6">
              {editingLibrary.id ? '図書室を編集' : '新しい図書室を追加'}
            </h2>
            <form onSubmit={handleSaveLibrary}>
              {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="libName" className="block text-text-light mb-1 font-medium">図書室名</label>
                  <input
                    id="libName" type="text" value={editingLibrary.name}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    required disabled={isLoading} placeholder="例: 中央図書室"
                  />
                </div>
                <div>
                  <label htmlFor="libLocation" className="block text-text-light mb-1 font-medium">場所</label>
                  <input
                    id="libLocation" type="text" value={editingLibrary.location}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading} placeholder="例: 本館1階"
                  />
                </div>
                <div>
                  <label htmlFor="libCapacity" className="block text-text-light mb-1 font-medium">定員</label>
                  <input
                    id="libCapacity" type="number" value={editingLibrary.capacity}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, capacity: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading} placeholder="例: 50"
                  />
                </div>
                <div className="flex items-center mt-4 md:mt-7">
                  <input
                    id="libIsActive" type="checkbox" checked={editingLibrary.is_active}
                    onChange={(e) => setEditingLibrary({ ...editingLibrary, is_active: e.target.checked })}
                    className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary mr-2"
                    disabled={isLoading}
                  />
                  <label htmlFor="libIsActive" className="text-text-light font-medium">開館中</label>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-text mt-6 mb-3">利用可能時間</h3>
              {editingLibrary.availability.map((slot, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center mb-3 p-3 border rounded-md bg-gray-50">
                  <select
                    value={slot.day_of_week}
                    onChange={(e) => handleAvailabilityChange(index, 'day_of_week', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoading}
                  >
                    {daysOfWeekMap.map((day, i) => <option key={i} value={i}>{day}曜日</option>)}
                  </select>
                  <input
                    type="time" value={slot.open_time}
                    onChange={(e) => handleAvailabilityChange(index, 'open_time', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <input
                    type="time" value={slot.close_time}
                    onChange={(e) => handleAvailabilityChange(index, 'close_time', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="button" onClick={() => removeAvailabilitySlot(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                    disabled={isLoading}
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button" onClick={addAvailabilitySlot}
                className="mt-2 mb-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50 flex items-center"
                disabled={isLoading}
              >
                <FaPlus className="mr-2"/>時間帯を追加
              </button>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button" onClick={closeForm} disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit" disabled={isLoading}
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
