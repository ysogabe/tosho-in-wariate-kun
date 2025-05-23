'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave } from 'react-icons/fa';

interface ScheduleRule {
  id: number;
  name: string;
  description: string;
  type: string;
  priority: number;
}

interface EditingRuleState {
  id?: number;
  name: string;
  description: string;
  type: string;
  priority: string; // Keep as string for form input, convert on save
}

const API_RULES_URL = 'http://localhost:5001/api/schedule-rules';

// Available rule types - could be fetched from backend if dynamic
const RULE_TYPES = ["min_members_per_slot", "max_consecutive_hours", "max_hours_per_week_per_member", "min_members_from_same_class_per_slot", "custom"];


export default function ScheduleRulesPage() {
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [editingRule, setEditingRule] = useState<EditingRuleState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');


  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_RULES_URL);
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const data: ScheduleRule[] = await response.json();
      setRules(data.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity))); // Sort by priority
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルールデータの取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.name || !editingRule.type || editingRule.priority === '') {
      setFormError('ルール名、タイプ、優先度を入力してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);
    setSuccessMessage('');

    const method = editingRule.id ? 'PUT' : 'POST';
    const url = editingRule.id ? `${API_RULES_URL}/${editingRule.id}` : API_RULES_URL;
    
    const payload = {
      name: editingRule.name,
      description: editingRule.description,
      type: editingRule.type,
      priority: Number(editingRule.priority),
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
      await fetchRules();
      setSuccessMessage(editingRule.id ? 'ルールが更新されました。' : 'ルールが追加されました。');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (rule: ScheduleRule) => {
    setEditingRule({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      priority: String(rule.priority ?? ''),
    });
    setFormError(null);
    setShowForm(true);
    setSuccessMessage('');
  };

  const startAddingNew = () => {
    setEditingRule({
      name: '',
      description: '',
      type: RULE_TYPES[0], // Default to first type
      priority: String(rules.length > 0 ? Math.max(...rules.map(r => r.priority ?? 0)) + 1 : 1), // Suggest next priority
    });
    setFormError(null);
    setShowForm(true);
    setSuccessMessage('');
  };

  const deleteRule = async (id: number) => {
    if (confirm('このルールを削除してもよろしいですか？')) {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');
      try {
        const response = await fetch(`${API_RULES_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchRules();
        setSuccessMessage('ルールが削除されました。');
        setTimeout(() => setSuccessMessage(''), 3000);
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
    setEditingRule(null);
    setFormError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ スケジュールルール設定 ✨</h1>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 transition-opacity duration-300">
          {successMessage}
        </div>
      )}
      {error && <p className="text-center text-red-500 my-4">エラー: {error}</p>}


      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">ルール一覧</h2>
          <button
            onClick={startAddingNew}
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
          >
            <FaPlus className="mr-2" />
            新規ルール追加
          </button>
        </div>

        {isLoading && rules.length === 0 && <p className="text-center text-gray-500">ルールを読み込み中...</p>}
        {!isLoading && !error && rules.length === 0 && <p className="text-center text-gray-500">登録されているルールがありません。</p>}

        {rules.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">優先度</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">ルール名</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">説明</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">タイプ</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{rule.priority}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{rule.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{rule.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{rule.type}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex item-center justify-center space-x-2">
                        <button
                          onClick={() => startEditing(rule)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                          title="編集"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                          title="削除"
                        >
                          <FaTrash size={18} />
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

      {showForm && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-text mb-6">
              {editingRule.id ? 'ルールを編集' : '新しいルールを追加'}
            </h2>
            <form onSubmit={handleSaveRule}>
              {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
              
              <div className="mb-4">
                <label htmlFor="ruleName" className="block text-text-light mb-1 font-medium">ルール名</label>
                <input
                  id="ruleName" type="text" value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  required disabled={isLoading}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="ruleDescription" className="block text-text-light mb-1 font-medium">説明</label>
                <textarea
                  id="ruleDescription" value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3} disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="ruleType" className="block text-text-light mb-1 font-medium">タイプ</label>
                  <select
                    id="ruleType" value={editingRule.type}
                    onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    required disabled={isLoading}
                  >
                    {RULE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="rulePriority" className="block text-text-light mb-1 font-medium">優先度</label>
                  <input
                    id="rulePriority" type="number" value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    required disabled={isLoading} placeholder="例: 1 (小さいほど高優先)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button" onClick={closeForm} disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit" disabled={isLoading}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
                >
                  <FaSave className="mr-2" />
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
