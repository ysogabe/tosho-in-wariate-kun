'use client';

import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

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

interface MembersTableProps {
  members: CommitteeMember[];
  isLoading: boolean;
  availableClasses: ClassData[];
  startEditing: (member: CommitteeMember) => void;
  deleteMember: (id: number) => void;
  filterGrade?: number | null;
  filterName?: string;
}

type SortField = 'id' | 'name' | 'grade_name' | 'class_name' | 'role';
type SortDirection = 'asc' | 'desc';

const MembersTable: React.FC<MembersTableProps> = ({ 
  members, 
  isLoading, 
  availableClasses, 
  startEditing, 
  deleteMember,
  filterGrade,
  filterName
}) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filteredMembers, setFilteredMembers] = useState<CommitteeMember[]>(members);

  // ソート関数
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいフィールドの場合は昇順から始める
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートアイコンの表示
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="ml-1 inline-block" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 inline-block text-blue-600" /> : 
      <FaSortDown className="ml-1 inline-block text-blue-600" />;
  };

  // メンバーをフィルタリングしてソートする
  useEffect(() => {
    let result = [...members];
    
    // 学年フィルター
    if (filterGrade !== undefined && filterGrade !== null) {
      result = result.filter(member => member.grade_id === filterGrade);
    }
    
    // 名前フィルター
    if (filterName) {
      const searchTerm = filterName.toLowerCase();
      result = result.filter(member => 
        member.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // ソート
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredMembers(result);
  }, [members, sortField, sortDirection, filterGrade, filterName]);
  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* ヘッダー行 */}
      <div className="flex bg-gray-100 text-gray-600 uppercase text-sm leading-normal rounded-t-lg">
        <div 
          className="py-3 px-6 text-left w-1/12 cursor-pointer hover:bg-gray-200 transition-colors" 
          onClick={() => handleSort('id')}
        >
          ID {renderSortIcon('id')}
        </div>
        <div 
          className="py-3 px-6 text-left w-2/12 cursor-pointer hover:bg-gray-200 transition-colors" 
          onClick={() => handleSort('name')}
        >
          名前 {renderSortIcon('name')}
        </div>
        <div 
          className="py-3 px-6 text-left w-2/12 cursor-pointer hover:bg-gray-200 transition-colors" 
          onClick={() => handleSort('grade_name')}
        >
          学年 {renderSortIcon('grade_name')}
        </div>
        <div 
          className="py-3 px-6 text-left w-2/12 cursor-pointer hover:bg-gray-200 transition-colors" 
          onClick={() => handleSort('class_name')}
        >
          クラス {renderSortIcon('class_name')}
        </div>
        <div 
          className="py-3 px-6 text-left w-2/12 cursor-pointer hover:bg-gray-200 transition-colors" 
          onClick={() => handleSort('role')}
        >
          役割 {renderSortIcon('role')}
        </div>
        <div className="py-3 px-6 text-center w-3/12">操作</div>
      </div>
      
      {/* データ行 */}
      <div className="text-gray-600 text-sm">
        {filteredMembers.length === 0 ? (
          <div className="flex border-b border-gray-200 py-4 px-6 text-center justify-center">
            {isLoading ? '読み込み中...' : 'データがありません'}
          </div>
        ) : (
          filteredMembers.map((member) => (
          <div key={member.id} className="flex border-b border-gray-200 hover:bg-gray-50">
            <div className="py-3 px-6 text-left w-1/12">{member.id}</div>
            <div className="py-3 px-6 text-left w-2/12">{member.name}</div>
            <div className="py-3 px-6 text-left w-2/12">{member.grade_name}</div>
            <div className="py-3 px-6 text-left w-2/12">{member.class_name}</div>
            <div className="py-3 px-6 text-left w-2/12">{member.role}</div>
            <div className="py-3 px-6 text-center w-3/12">
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
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};

export default MembersTable;
