'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import SchoolInfoForm from './components/SchoolInfoForm';
import PositionsTable from './components/PositionsTable';
import LibrariesTable from './components/LibrariesTable';
import ClassesTable from './components/ClassesTable';

export default function SchoolInfoPage() {
  const [activeTab, setActiveTab] = useState('school-info');

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">学校基本情報管理</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="school-info">基本情報</TabsTrigger>
          <TabsTrigger value="positions">役職管理</TabsTrigger>
          <TabsTrigger value="libraries">図書室管理</TabsTrigger>
          <TabsTrigger value="classes">クラス管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="school-info">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">学校基本情報</h2>
            <SchoolInfoForm />
          </Card>
        </TabsContent>
        
        <TabsContent value="positions">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">役職管理</h2>
            <PositionsTable />
          </Card>
        </TabsContent>
        
        <TabsContent value="libraries">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">図書室管理</h2>
            <LibrariesTable />
          </Card>
        </TabsContent>
        
        <TabsContent value="classes">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">クラス管理</h2>
            <ClassesTable />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
