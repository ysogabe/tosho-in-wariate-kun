import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderTop: '2px dashed hsl(350, 80%, 90%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <p className="text-center text-sm" style={{ color: 'hsl(340, 60%, 55%)', fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif' }}>&copy; {new Date().getFullYear()} 図書当番割り当てくん ✨</p>
      </div>
    </footer>
  );
};

export default Footer;
