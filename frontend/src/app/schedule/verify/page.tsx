'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScheduleVerifyPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the management validate-schedule page
    router.replace('/management/validate-schedule');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">リダイレクト中...</p>
    </div>
  );
}