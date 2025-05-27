'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCog, FaUserTie, FaBook, FaUsers } from 'react-icons/fa';
import { Card } from '@/components/ui/card';
import SchoolInfoForm from './components/SchoolInfoForm';
import PositionsTable from './components/PositionsTable';
import LibrariesTable from './components/LibrariesTable';
import ClassesTable from './components/ClassesTable';

export default function SchoolInfoPage() {
  const [activeTab, setActiveTab] = useState('school-info');

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ 学校基本情報管理 ✨</h1>
      </div>
      
      <div className="w-full mb-8">
        <div className="grid w-full grid-cols-4 gap-2 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('school-info')} 
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'school-info' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
            style={{
              backgroundColor: activeTab === 'school-info' ? 'hsl(180, 65%, 75%)' : 'hsl(180, 65%, 85%)', 
              color: 'hsl(180, 65%, 25%)',
              border: '1px solid hsl(180, 65%, 65%)'
            }}
          >
            <FaCog className="text-lg" />
            基本情報
          </button>
          <button 
            onClick={() => setActiveTab('positions')} 
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'positions' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
            style={{
              backgroundColor: activeTab === 'positions' ? 'hsl(180, 65%, 75%)' : 'hsl(180, 65%, 85%)', 
              color: 'hsl(180, 65%, 25%)',
              border: '1px solid hsl(180, 65%, 65%)'
            }}
          >
            <FaUserTie className="text-lg" />
            役職管理
          </button>
          <button 
            onClick={() => setActiveTab('libraries')} 
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'libraries' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
            style={{
              backgroundColor: activeTab === 'libraries' ? 'hsl(180, 65%, 75%)' : 'hsl(180, 65%, 85%)', 
              color: 'hsl(180, 65%, 25%)',
              border: '1px solid hsl(180, 65%, 65%)'
            }}
          >
            <FaBook className="text-lg" />
            図書室管理
          </button>
          <button 
            onClick={() => setActiveTab('classes')} 
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'classes' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
            style={{
              backgroundColor: activeTab === 'classes' ? 'hsl(180, 65%, 75%)' : 'hsl(180, 65%, 85%)', 
              color: 'hsl(180, 65%, 25%)',
              border: '1px solid hsl(180, 65%, 65%)'
            }}
          >
            <FaUsers className="text-lg" />
            クラス管理
          </button>
        </div>
      </div>

      <div className="w-full">
        {activeTab === 'school-info' && (
          <Card className="p-6 border-2 border-dashed border-secondary bg-gray-50">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCog className="mr-2 text-primary" />
              学校基本情報
            </h2>
            <SchoolInfoForm />
          </Card>
        )}
        
        {activeTab === 'positions' && (
          <Card className="p-6 border-2 border-dashed border-secondary bg-gray-50">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaUserTie className="mr-2 text-primary" />
              役職管理
            </h2>
            <PositionsTable />
          </Card>
        )}
        
        {activeTab === 'libraries' && (
          <Card className="p-6 border-2 border-dashed border-secondary bg-gray-50">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaBook className="mr-2 text-primary" />
              図書室管理
            </h2>
            <LibrariesTable />
          </Card>
        )}
        
        {activeTab === 'classes' && (
          <Card className="p-6 border-2 border-dashed border-secondary bg-gray-50">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaUsers className="mr-2 text-primary" />
              クラス管理
            </h2>
            <ClassesTable />
          </Card>
        )}
      </div>
    </div>
  );
}
