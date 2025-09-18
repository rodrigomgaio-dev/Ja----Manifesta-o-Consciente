import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const systemColorScheme = useColorScheme();
  
  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';
    
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{
      themeMode,
      colors,
      setThemeMode,
      isDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}