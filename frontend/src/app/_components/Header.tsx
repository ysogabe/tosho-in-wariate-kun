import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCog } from 'react-icons/fa';

interface HeaderProps {
  userName: string;
  schoolName: string;
}

const Header: React.FC<HeaderProps> = ({ userName, schoolName }) => {
  return (
    <header className="shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderBottom: '2px dashed hsl(350, 80%, 90%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 relative mr-3 animate-float">
              <Image 
                src="/images/books-icon.png" 
                alt="本のアイコン"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(340, 80%, 45%)', fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif', textShadow: '1px 1px 0 rgba(255, 255, 255, 0.8)' }}>{schoolName} 図書委員当番</h1>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-4" style={{ color: 'hsl(340, 70%, 40%)' }}>{userName}さん</span>
          <Link href="/management" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300 mr-2">
            <FaCog className="text-xl" style={{ color: 'hsl(340, 60%, 65%)' }} />
          </Link>
          <Link href="/login" className="inline-flex items-center h-8 px-4 bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium" style={{ color: 'hsl(340, 60%, 65%)' }}>
            ログアウト
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
