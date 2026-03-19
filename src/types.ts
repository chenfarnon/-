import { ReactNode } from 'react';

export type AppId = 'notepad' | 'calculator' | 'terminal' | 'settings' | 'browser' | 'gemini' | 'creative';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface AppConfig {
  id: AppId;
  name: string;
  icon: ReactNode;
  component: ReactNode;
}
