'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaUsers, FaSchool, FaBook, FaDoorOpen, FaCalendarAlt, FaCog, FaArrowLeft } from 'react-icons/fa';
import ManagementCard from '../_components/ManagementCard';
import PageLayout from '../_components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSchool } from '@/contexts/SchoolContext';

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [userName] = useState('管理者');
  const { schoolName } = useSchool();

  const managementItems = {
    basic: [
      {
        title: '学年管理',
        icon: <FaSchool />,
        description: '学年情報の登録・編集・削除を行います',
        link: '/management/grades'
      },
      {
        title: 'クラス管理',
        icon: <FaUsers />,
        description: 'クラス情報の登録・編集・削除を行います',
        link: '/management/classes'
      },
      {
        title: '図書委員管理',
        icon: <FaUsers />,
        description: '図書委員の登録・編集・削除を行います',
        link: '/management/committee-members'
      },
      {
        title: '図書室管理',
        icon: <FaDoorOpen />,
        description: '図書室情報の登録・編集・削除を行います',
        link: '/management/libraries'
      }
    ],
    schedule: [
      {
        title: 'スケジュールルール設定',
        icon: <FaCog />,
        description: '当番割り当てのルールを設定します',
        link: '/management/schedule-rules'
      },
      {
        title: 'スケジュール生成',
        icon: <FaCalendarAlt />,
        description: '設定したルールに基づいてスケジュールを生成します',
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
            <Button
              onClick={() => setActiveTab('basic')}
              variant={activeTab === 'basic' ? 'primary' : 'outline'}
              size="lg"
              className="rounded-full"
            >
              基本情報管理
            </Button>
            <Button
              onClick={() => setActiveTab('schedule')}
              variant={activeTab === 'schedule' ? 'primary' : 'outline'}
              size="lg"
              className="rounded-full"
            >
              スケジュール管理
            </Button>
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
