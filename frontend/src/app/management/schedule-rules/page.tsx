'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default function ScheduleRulesPage() {
  const [rules, setRules] = useState({
    minDutyPerMonth: 2,
    maxDutyPerMonth: 4,
    minRestDaysBetweenDuties: 1,
    allowSamePersonSameDay: false,
    prioritizeHigherGrades: true,
    distributeEvenly: true,
    considerPreferences: true,
  });
  const [successMessage, setSuccessMessage] = useState('');

  // ルールを保存
  const saveRules = () => {
    // ここで実際にはAPIを呼び出してルールを保存する
    setSuccessMessage('スケジュールルールが保存されました');
    setTimeout(() => setSuccessMessage(''), 3000);
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <h2 className="text-2xl font-bold text-text mb-6">基本ルール設定</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-text-light mb-2">1ヶ月あたりの最小当番回数</label>
              <input
                type="number"
                value={rules.minDutyPerMonth}
                onChange={(e) => setRules({ ...rules, minDutyPerMonth: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                max="10"
              />
            </div>
            <div>
              <label className="block text-text-light mb-2">1ヶ月あたりの最大当番回数</label>
              <input
                type="number"
                value={rules.maxDutyPerMonth}
                onChange={(e) => setRules({ ...rules, maxDutyPerMonth: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-light mb-2">当番間の最小休息日数</label>
            <input
              type="number"
              value={rules.minRestDaysBetweenDuties}
              onChange={(e) => setRules({ ...rules, minRestDaysBetweenDuties: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="10"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text">追加ルール</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSamePersonSameDay"
                checked={rules.allowSamePersonSameDay}
                onChange={(e) => setRules({ ...rules, allowSamePersonSameDay: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary border-secondary rounded"
              />
              <label htmlFor="allowSamePersonSameDay" className="ml-2 text-text-light">同じ人が同じ日に複数の当番を担当することを許可する</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="prioritizeHigherGrades"
                checked={rules.prioritizeHigherGrades}
                onChange={(e) => setRules({ ...rules, prioritizeHigherGrades: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary border-secondary rounded"
              />
              <label htmlFor="prioritizeHigherGrades" className="ml-2 text-text-light">高学年を優先的に割り当てる</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="distributeEvenly"
                checked={rules.distributeEvenly}
                onChange={(e) => setRules({ ...rules, distributeEvenly: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary border-secondary rounded"
              />
              <label htmlFor="distributeEvenly" className="ml-2 text-text-light">当番を均等に分配する</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="considerPreferences"
                checked={rules.considerPreferences}
                onChange={(e) => setRules({ ...rules, considerPreferences: e.target.checked })}
                className="w-5 h-5 text-primary focus:ring-primary border-secondary rounded"
              />
              <label htmlFor="considerPreferences" className="ml-2 text-text-light">委員の希望を考慮する</label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveRules}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center"
          >
            <FaSave className="mr-2" />
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
