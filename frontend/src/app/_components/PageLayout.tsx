import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  userName: string;
  schoolName: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, userName, schoolName }) => {
  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: 'hsl(50, 100%, 97%)', 
      backgroundImage: 'linear-gradient(135deg, rgba(255, 230, 240, 0.4) 0%, rgba(255, 240, 245, 0.3) 100%)' 
    }}>
      <Header userName={userName} schoolName={schoolName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
