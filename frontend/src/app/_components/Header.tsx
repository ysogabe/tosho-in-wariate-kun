import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';

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
          <div className="flex justify-center items-center h-8 mr-4" style={{ color: 'hsl(340, 70%, 40%)', minWidth: '100px' }}>
            <span>{userName}さん</span>
          </div>
          <Link 
            href="/management" 
            className="inline-flex items-center justify-center h-8 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-300 text-sm font-bold mr-2" 
            style={{ backgroundColor: 'hsl(0, 65%, 97%)', color: 'hsl(0, 65%, 35%)', borderColor: 'hsl(0, 65%, 75%)', borderWidth: '1px', opacity: '0.8' }}
          >
            <FaCog className="mr-1.5" />
            管理画面
          </Link>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center h-8 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium text-white" 
            style={{ backgroundColor: 'hsl(180, 65%, 65%)', borderColor: 'hsl(180, 65%, 55%)', borderWidth: '1px' }}
          >
            <FaSignOutAlt className="mr-1.5" />
            ログアウト
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
