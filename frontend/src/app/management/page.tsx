'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaUsers, FaBook, FaCalendarAlt, FaCog, FaArrowLeft } from 'react-icons/fa';
import ManagementCard from '../_components/ManagementCard';
import PageLayout from '../_components/PageLayout';
import { Card } from '@/components/ui/card';
import { useSchool } from '@/contexts/SchoolContext';

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [userName] = useState('管理者');
  const { schoolName } = useSchool();

  const managementItems = {
    basic: [
      {
        title: '学校基本情報管理',
        icon: <FaCog />,
        description: '学校情報、役職、図書室、クラスを一元管理します',
        link: '/school'
      },
      {
        title: '図書委員管理',
        icon: <FaUsers />,
        description: '図書委員の登録・編集・削除を行います',
        link: '/management/committee-members'
      }
    ],
    schedule: [
      {
        title: 'スケジュール生成',
        icon: <FaCalendarAlt />,
        description: 'スケジュールを生成します',
        link: '/management/generate-schedule'
      },
      {
        title: 'スケジュール検証',
        icon: <FaBook />,
        description: '生成されたスケジュールを検証します',
        link: '/management/validate-schedule'
      }
    ]
  };

  return (
    <PageLayout userName={userName} schoolName={schoolName}>
      <div className="animate-fadeIn">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="mr-4 text-primary hover:text-primary-dark transition-colors">
            <FaArrowLeft className="text-2xl" />
          </Link>
          <h1 className="text-3xl font-bold text-text">✨ 管理画面 ✨</h1>
        </div>

        <Card className="p-6 mb-8 bg-opacity-70">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`rounded-full px-8 py-2 text-base font-medium transition-colors ${activeTab === 'schedule' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
              style={{
                backgroundColor: activeTab === 'schedule' ? 'hsl(0, 65%, 95%)' : 'hsl(0, 65%, 97%)', 
                color: 'hsl(0, 65%, 35%)',
                border: '1px solid hsl(0, 65%, 75%)'
              }}
            >
              <FaCalendarAlt className="inline-block mr-2" />
              スケジュール管理
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`rounded-full px-8 py-2 text-base font-medium transition-colors ${activeTab === 'basic' ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
              style={{
                backgroundColor: activeTab === 'basic' ? 'hsl(180, 65%, 75%)' : 'hsl(180, 65%, 85%)', 
                color: 'hsl(180, 65%, 25%)',
                border: '1px solid hsl(180, 65%, 65%)'
              }}
            >
              <FaCog className="inline-block mr-2" />
              基本情報管理
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementItems[activeTab as keyof typeof managementItems].map((item, index) => (
              <ManagementCard
                key={index}
                title={item.title}
                icon={item.icon}
                description={item.description}
                link={item.link}
              />
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
