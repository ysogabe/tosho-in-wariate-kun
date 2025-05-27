'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SchoolContextType {
  schoolName: string;
  setSchoolName: (name: string) => void;
}

const defaultContext: SchoolContextType = {
  schoolName: '',
  setSchoolName: () => {},
};

const SchoolContext = createContext<SchoolContextType>(defaultContext);

export const useSchool = () => useContext(SchoolContext);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  // デフォルト値で初期化
  const [schoolName, setSchoolName] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // APIから学校情報を取得する関数
  const fetchSchoolData = async () => {
    try {
      const response = await fetch('http://localhost:5012/api/schools');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
        // 最初の学校を使用
        return data[0].school_name;
      }
      return '';
    } catch (error) {
      console.error('Failed to fetch school data:', error);
      return '';
    }
  };

  // マウント時にAPIから学校名を取得し、なければローカルストレージから読み込む
  useEffect(() => {
    const initializeSchoolName = async () => {
      setIsLoading(true);
      // まずAPIから取得を試みる
      const apiSchoolName = await fetchSchoolData();
      
      if (apiSchoolName) {
        setSchoolName(apiSchoolName);
        localStorage.setItem('schoolName', apiSchoolName);
      } else {
        // APIから取得できなかった場合、ローカルストレージを確認
        const storedSchoolName = localStorage.getItem('schoolName');
        if (storedSchoolName) {
          setSchoolName(storedSchoolName);
        } else {
          // デフォルト値を設定
          setSchoolName('学校名未設定');
        }
      }
      
      setIsLoading(false);
      setIsInitialized(true);
    };
    
    initializeSchoolName();
  }, []);

  // 学校名を設定し、ローカルストレージに保存
  const handleSetSchoolName = (name: string) => {
    setSchoolName(name);
    localStorage.setItem('schoolName', name);
  };

  return (
    <SchoolContext.Provider value={{ schoolName, setSchoolName: handleSetSchoolName }}>
      {isInitialized && !isLoading ? children : null}
    </SchoolContext.Provider>
  );
};
