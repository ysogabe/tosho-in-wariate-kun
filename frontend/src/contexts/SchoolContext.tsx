'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SchoolContextType {
  schoolName: string;
  setSchoolName: (name: string) => void;
}

const defaultContext: SchoolContextType = {
  schoolName: 'XX小学校',
  setSchoolName: () => {},
};

const SchoolContext = createContext<SchoolContextType>(defaultContext);

export const useSchool = () => useContext(SchoolContext);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  // デフォルト値で初期化
  const [schoolName, setSchoolName] = useState<string>('XX小学校');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // マウント時にローカルストレージから学校名を読み込む
  useEffect(() => {
    const storedSchoolName = localStorage.getItem('schoolName');
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
    }
    setIsInitialized(true);
  }, []);

  // 学校名を設定し、ローカルストレージに保存
  const handleSetSchoolName = (name: string) => {
    setSchoolName(name);
    localStorage.setItem('schoolName', name);
  };

  return (
    <SchoolContext.Provider value={{ schoolName, setSchoolName: handleSetSchoolName }}>
      {isInitialized ? children : null}
    </SchoolContext.Provider>
  );
};
