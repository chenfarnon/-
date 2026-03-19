import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Star, 
  User, 
  Folder, 
  Search, 
  LayoutGrid, 
  Mic, 
  Settings as SettingsIcon,
  Shield,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code,
  Activity,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Video,
  Send,
  Paperclip,
  Volume2,
  Brain,
  History,
  Trash2,
  Download,
  RefreshCw,
  Type,
  Bot,
  Trash,
  Globe,
  ExternalLink,
  FileText,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  Monitor,
  Wifi,
  Signal,
  Lock,
  LogOut,
  LogIn,
  Mail,
  Key,
} from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, auth, handleFirestoreError, OperationType, FirebaseUser } from '../firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Notepad: React.FC = () => {
  const [files, setFiles] = useState<{ id: string, title: string, content: string, updatedAt: any }[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/notepad_files`),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setFiles(fetchedFiles);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/notepad_files`);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content);
      setTitle(activeFile.title);
    } else {
      setContent('');
      setTitle('Untitled');
    }
  }, [activeFileId, files]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);

    const fileId = activeFileId || Math.random().toString(36).substr(2, 9);
    const path = `users/${auth.currentUser.uid}/notepad_files/${fileId}`;

    try {
      await setDoc(doc(db, path), {
        id: fileId,
        uid: auth.currentUser.uid,
        title: title,
        content: content,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setActiveFileId(fileId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewFile = () => {
    setActiveFileId(null);
    setContent('');
    setTitle('Untitled');
  };

  const deleteFile = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/notepad_files/${id}`;
    try {
      await deleteDoc(doc(db, path));
      if (activeFileId === id) createNewFile();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Autosave effect
  useEffect(() => {
    if (!activeFileId || !auth.currentUser) return;
    
    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // Autosave after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, title]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white text-black overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-bold text-sm text-gray-500 uppercase tracking-widest">Documents</span>
          <button 
            onClick={createNewFile}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-blue-600"
            title="New File"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map(file => (
            <div 
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                activeFileId === file.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-200"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className={activeFileId === file.id ? "text-blue-500" : "text-gray-400"} />
                <span className="text-sm font-medium truncate">{file.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-gray-400">No documents yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold outline-none bg-transparent flex-1 mr-4"
            placeholder="Document Title"
          />
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              isSaving ? "bg-gray-100 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            )}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <textarea
          className="flex-1 w-full p-8 outline-none resize-none font-sans text-base leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your thoughts..."
        />
      </div>
    </div>
  );
};

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNum = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="h-full bg-[#f3f3f3] p-4 flex flex-col">
      <div className="text-right mb-4">
        <div className="text-xs text-gray-500 h-4">{equation}</div>
        <div className="text-3xl font-semibold overflow-hidden">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-1 flex-1">
        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map(btn => (
          <button
            key={btn}
            onClick={() => {
              if (btn === '=') calculate();
              else if (['+', '-', '*', '/'].includes(btn)) handleOp(btn);
              else handleNum(btn);
            }}
            className="bg-white hover:bg-gray-100 border border-gray-200 rounded p-2 text-lg transition-colors"
          >
            {btn}
          </button>
        ))}
        <button onClick={() => { setDisplay('0'); setEquation(''); }} className="col-span-4 bg-red-100 hover:bg-red-200 p-2 rounded mt-1">Clear</button>
      </div>
    </div>
  );
};

interface Tab {
  id: string;
  title: string;
  url: string;
  zoom: number;
  history?: string[];
}

const ChromeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#4285F4"/>
    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="white"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="#4285F4"/>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 13.59 2.38 15.09 3.05 16.41L7.5 8.66C8.35 7.19 9.91 6.25 11.69 6.04L12 2.02V2Z" fill="#EA4335"/>
    <path d="M22 12C22 14.65 20.97 17.06 19.28 18.84L14.83 11.13C14.4 10.38 13.76 9.79 12.98 9.42L16.41 3.48C19.72 5.03 22 8.25 22 12Z" fill="#FBBC05"/>
    <path d="M12 22C9.27 22 6.8 20.91 5 19.14L9.45 11.43C9.88 12.18 10.52 12.77 11.3 13.14L7.87 19.08C4.56 17.53 2.28 14.31 2.28 10.56C2.28 10.37 2.28 10.18 2.29 10L12 22Z" fill="#34A853"/>
  </svg>
);

export const Browser: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', title: '新分頁', url: '執行 Google 搜尋或輸入網址', zoom: 100 }]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [bookmarks, setBookmarks] = useState<{ title: string, url: string }[]>([]);
  const [isIncognito, setIsIncognito] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<{ id: string, title: string, url: string, timestamp: any }[]>([]);
  const [devToolsTab, setDevToolsTab] = useState<'console' | 'elements' | 'network'>('console');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<{ type: string, msg: string, time: string }[]>([
    { type: 'info', msg: 'Browser engine initialized', time: new Date().toLocaleTimeString() },
    { type: 'warn', msg: 'Deprecation warning: synchronous XHR', time: new Date().toLocaleTimeString() }
  ]);
  const [realResults, setRealResults] = useState<{ title: string, url: string, snippet: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isVisiting, setIsVisiting] = useState(false);
  const [visitUrl, setVisitUrl] = useState('');
  const [showGoogleApps, setShowGoogleApps] = useState(false);
  const [themeColor, setThemeColor] = useState('#35363a');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const themeColors = [
    { name: '預設', color: '#35363a' },
    { name: '藍色', color: '#1a73e8' },
    { name: '綠色', color: '#1e8e3e' },
    { name: '紅色', color: '#d93025' },
    { name: '紫色', color: '#9334e6' },
    { name: '深色', color: '#202124' },
  ];

  const googleApps = [
    { name: '帳戶', icon: <User size={20} className="text-blue-400" />, url: 'https://myaccount.google.com' },
    { name: '搜尋', icon: <Search size={20} className="text-[#4285F4]" />, url: 'https://www.google.com' },
    { name: '地圖', icon: <Globe size={20} className="text-[#34A853]" />, url: 'https://www.google.com/maps' },
    { name: 'YouTube', icon: <PlayCircle size={20} className="text-[#EA4335]" />, url: 'https://www.youtube.com' },
    { name: 'Play', icon: <LayoutGrid size={20} className="text-[#FBBC05]" />, url: 'https://play.google.com' },
    { name: '新聞', icon: <Mail size={20} className="text-[#4285F4]" />, url: 'https://news.google.com' },
    { name: 'Gmail', icon: <Mail size={20} className="text-[#EA4335]" />, url: 'https://mail.google.com' },
    { name: 'Meet', icon: <Video size={20} className="text-[#34A853]" />, url: 'https://meet.google.com' },
    { name: '雲端硬碟', icon: <Folder size={20} className="text-[#FBBC05]" />, url: 'https://drive.google.com' },
  ];

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Load tabs and bookmarks from Firestore
  useEffect(() => {
    if (!auth.currentUser || isIncognito) return;

    const browserDataRef = doc(db, `users/${auth.currentUser.uid}/apps/browser`);
    const unsubscribe = onSnapshot(browserDataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.content) {
          const parsed = JSON.parse(data.content);
          if (parsed.tabs) setTabs(parsed.tabs);
          if (parsed.activeTabId) setActiveTabId(parsed.activeTabId);
          if (parsed.bookmarks) setBookmarks(parsed.bookmarks);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/apps/browser`);
    });

    return () => unsubscribe();
  }, [isIncognito]);

  // Save tabs and bookmarks to Firestore
  useEffect(() => {
    if (!auth.currentUser || isIncognito) return;

    const timer = setTimeout(async () => {
      const browserDataRef = doc(db, `users/${auth.currentUser.uid}/apps/browser`);
      try {
        await setDoc(browserDataRef, {
          content: JSON.stringify({ tabs, activeTabId, bookmarks }),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser?.uid}/apps/browser`);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [tabs, activeTabId, bookmarks, isIncognito]);

  // Keyboard Shortcuts for Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoom(10);
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoom(-10);
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  // Sync isVisiting and isSearching with activeTab.url
  useEffect(() => {
    const url = activeTab.url;
    if (url === '執行 Google 搜尋或輸入網址') {
      setIsVisiting(false);
      setIsSearching(false);
      setSearchQuery('');
    } else if (url.includes('google.com')) {
      if (url.includes('/search?q=')) {
        try {
          const query = new URL(url).searchParams.get('q') || '';
          setSearchQuery(query);
          setIsSearching(true);
          setIsVisiting(false);
        } catch (e) {
          // Fallback if URL is malformed
          setIsSearching(false);
          setIsVisiting(false);
        }
      } else {
        setIsSearching(false);
        setIsVisiting(false);
        setSearchQuery('');
      }
    } else if (url.startsWith('http')) {
      setIsVisiting(true);
      setVisitUrl(url);
      setIsSearching(false);
    } else {
      setIsVisiting(false);
      setIsSearching(false);
    }
  }, [activeTab.url]);

  const goBack = () => {
    if (activeTab.history && activeTab.history.length > 1) {
      const newHistory = [...activeTab.history];
      newHistory.pop(); // Remove current URL
      const prevUrl = newHistory[newHistory.length - 1];
      
      setTabs(tabs.map(t => 
        t.id === activeTabId 
          ? { ...t, url: prevUrl, title: prevUrl === '執行 Google 搜尋或輸入網址' ? '新分頁' : prevUrl, history: newHistory } 
          : t
      ));
    }
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTab = { id: newId, title: '新分頁', url: '執行 Google 搜尋或輸入網址', zoom: 100, history: ['執行 Google 搜尋或輸入網址'] };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (isIncognito) {
      setLogs(prev => [...prev, { type: 'info', msg: `Opened new incognito tab: ${newId}`, time: new Date().toLocaleTimeString() }]);
    }
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  // Load history from Firestore
  useEffect(() => {
    if (!auth.currentUser || isIncognito) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/browser_history`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setHistoryItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/browser_history`);
    });

    return () => unsubscribe();
  }, [isIncognito]);

  const saveHistory = async (title: string, url: string) => {
    if (!auth.currentUser || isIncognito || !url || url.includes('執行 Google 搜尋')) return;

    const historyId = Math.random().toString(36).substr(2, 9);
    const path = `users/${auth.currentUser.uid}/browser_history/${historyId}`;

    try {
      await setDoc(doc(db, path), {
        id: historyId,
        uid: auth.currentUser.uid,
        title,
        url,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/browser_history/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateTabUrl = (newUrl: string, saveToHistory = false) => {
    const isUrl = newUrl.startsWith('http') || (newUrl.includes('.') && !newUrl.includes(' '));
    
    if (isUrl) {
      const formattedUrl = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
      
      // Fix: If it's a Google URL, don't use iframe to avoid connection refused
      if (formattedUrl.includes('google.com')) {
        if (formattedUrl.includes('/search?q=')) {
          const query = new URL(formattedUrl).searchParams.get('q') || '';
          setSearchQuery(query);
          setIsSearching(true);
          setIsVisiting(false);
        } else {
          setIsSearching(false);
          setIsVisiting(false);
          setSearchQuery('');
        }
      } else {
        setIsVisiting(true);
        setVisitUrl(formattedUrl);
      }
      
      setTabs(tabs.map(t => {
        if (t.id === activeTabId) {
          const newHistory = saveToHistory ? [...(t.history || []), formattedUrl] : (t.history || []);
          return { ...t, url: formattedUrl, title: newUrl, history: newHistory };
        }
        return t;
      }));
      
      if (!isIncognito && saveToHistory) {
        saveHistory(newUrl, formattedUrl);
      }
    } else {
      setIsVisiting(false);
      setTabs(tabs.map(t => {
        if (t.id === activeTabId) {
          const newHistory = saveToHistory ? [...(t.history || []), newUrl] : (t.history || []);
          return { ...t, url: newUrl, history: newHistory };
        }
        return t;
      }));
      
      if (!isIncognito) {
        if (saveToHistory) {
          setLogs(prev => [...prev, { type: 'log', msg: `Navigated to: ${newUrl}`, time: new Date().toLocaleTimeString() }]);
          saveHistory(activeTab.title, newUrl);
        }
      }
    }
  };

  const handleZoom = (delta: number) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, zoom: Math.min(Math.max(t.zoom + delta, 50), 300) } : t));
  };

  const resetZoom = () => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, zoom: 100 } : t));
  };

  const toggleBookmark = () => {
    const isBookmarked = bookmarks.find(b => b.url === activeTab.url);
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(b => b.url !== activeTab.url));
    } else {
      setBookmarks([...bookmarks, { title: activeTab.title, url: activeTab.url }]);
    }
  };

  const toggleIncognito = () => {
    setIsIncognito(!isIncognito);
    if (!isIncognito) {
      // Entering incognito
      setTabs([{ id: 'incognito-1', title: '無痕分頁', url: '執行 Google 搜尋或輸入網址', zoom: 100 }]);
      setActiveTabId('incognito-1');
    } else {
      // Leaving incognito - the onSnapshot effect will restore tabs from Firestore
      // We can set a temporary loading state or just wait for the sync
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsVisiting(false);
    setIsSearching(true);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    updateTabUrl(searchUrl, true);
    setLogs(prev => [...prev, { type: 'info', msg: `Searching Google for: ${searchQuery}`, time: new Date().toLocaleTimeString() }]);
    
    setIsAiLoading(true);
    setRealResults([]);
    setSearchError(null);
    
    try {
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await aiInstance.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for "${searchQuery}" and provide 5 realistic search results in JSON format: [{title, url, snippet}]`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
          tools: [{ googleSearch: {} }]
        }
      });
      const results = JSON.parse(response.text || '[]');
      setRealResults(results);
    } catch (error: any) {
      console.error("Search Error:", error);
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
        setSearchError("API 額度已達上限，請稍後再試或更換 API 金鑰。");
      } else {
        setSearchError("搜尋時發生錯誤，請稍後再試。");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleHome = () => {
    setIsSearching(false);
    setSearchQuery('');
    updateTabUrl('執行 Google 搜尋或輸入網址');
  };

  return (
    <div className={`h-full flex flex-col font-sans select-none transition-colors duration-500 text-white`} style={{ backgroundColor: themeColor }}>
      {/* Tabs Bar */}
      <div className={`${isIncognito ? 'bg-[#000000]' : ''} h-10 flex items-center px-2 gap-1 pt-2 overflow-x-auto no-scrollbar`} style={{ backgroundColor: isIncognito ? undefined : `rgba(0,0,0,0.2)` }}>
        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`h-full px-4 rounded-t-lg flex items-center gap-2 text-[11px] min-w-[120px] max-w-[200px] border-x border-t transition-colors cursor-pointer ${
              activeTabId === tab.id 
                ? (isIncognito ? 'bg-[#1a1a1a] border-white/10' : 'bg-[#35363a] border-white/5')
                : 'bg-transparent border-transparent hover:bg-white/5'
            }`}
            style={{ backgroundColor: activeTabId === tab.id && !isIncognito ? themeColor : undefined }}
          >
            {isIncognito ? <Shield size={12} className="text-purple-400 flex-shrink-0" /> : <ChromeIcon size={16} />}
            <span className="truncate flex-1">{tab.title}</span>
            <X 
              size={18} 
              className="hover:bg-white/10 rounded p-0.5 flex-shrink-0" 
              onClick={(e) => closeTab(e, tab.id)}
            />
          </div>
        ))}
        <button 
          onClick={addTab}
          className="p-1.5 hover:bg-white/10 rounded-full flex-shrink-0"
        >
          <Plus size={14} />
        </button>
        <div className="flex-1" />
        <button 
          onClick={toggleIncognito}
          className={`p-1.5 rounded-full flex items-center gap-2 px-3 text-[10px] font-bold transition-all ${isIncognito ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
        >
          <Shield size={12} />
          {isIncognito ? '無痕模式' : '開啟無痕'}
        </button>
      </div>

      {/* Address Bar Area */}
      <div className={`${isIncognito ? 'bg-[#1a1a1a]' : ''} p-2 flex items-center gap-3 border-b border-black/20`} style={{ backgroundColor: isIncognito ? undefined : themeColor }}>
        <div className="flex items-center gap-2 px-1">
          <ArrowLeft 
            size={16} 
            className={`cursor-pointer ${(activeTab.history?.length || 0) > 1 ? 'text-white/80 hover:bg-white/10' : 'text-white/20 cursor-default'} rounded p-0.5`} 
            onClick={() => (activeTab.history?.length || 0) > 1 && goBack()}
          />
          <ArrowRight size={16} className="text-white/20 cursor-default rounded p-0.5" />
          <RotateCw size={16} className="text-white/80 hover:bg-white/10 rounded p-0.5 cursor-pointer" onClick={() => updateTabUrl(activeTab.url, true)} />
        </div>
        <div className={`flex-1 ${isIncognito ? 'bg-[#000000]' : 'bg-[#202124]'} rounded-full px-4 py-1.5 flex items-center gap-3 text-sm border border-transparent focus-within:border-blue-500/50`}>
          <Search size={14} className="text-white/40" />
          <input 
            type="text" 
            value={activeTab.url}
            onChange={(e) => updateTabUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateTabUrl(activeTab.url, true);
              }
            }}
            className="bg-transparent outline-none flex-1 text-white/90 placeholder-white/40"
          />
          <Star 
            size={14} 
            className={`cursor-pointer transition-colors ${
              bookmarks.find(b => b.url === activeTab.url) ? 'text-blue-400 fill-blue-400' : 'text-white/40 hover:text-white/80'
            }`} 
            onClick={toggleBookmark}
          />
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center bg-white/5 rounded-full px-2 py-1 gap-2">
            <button onClick={() => handleZoom(-10)} className="hover:bg-white/10 p-1 rounded-full"><ZoomOut size={12} /></button>
            <span className="text-[10px] font-mono w-8 text-center">{activeTab.zoom}%</span>
            <button onClick={() => handleZoom(10)} className="hover:bg-white/10 p-1 rounded-full"><ZoomIn size={12} /></button>
          </div>
          <button 
            onClick={() => setUseThinking(!useThinking)}
            className={cn(
              "p-1.5 rounded-full transition-all flex items-center gap-2 px-3 text-[10px] font-bold",
              useThinking ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
            title="Thinking Mode"
          >
            <Brain size={12} className={useThinking ? "animate-pulse" : ""} />
            {useThinking ? 'THINKING MODE' : 'BRAIN'}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-full transition-colors ${showHistory ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-white/60'}`}
            title="History"
          >
            <History size={16} />
          </button>
          <button 
            onClick={() => setShowDevTools(!showDevTools)}
            className={`p-1.5 rounded-full transition-colors ${showDevTools ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-white/60'}`}
            title="Developer Tools"
          >
            <Code size={16} />
          </button>
          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
            <img src={auth.currentUser?.photoURL || "https://www.gstatic.com/images/branding/product/2x/avatar_square_blue_120dp.png"} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Main Content Area with Transitions and Zoom */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              style={{ zoom: activeTab.zoom / 100 }}
              className="absolute inset-0 flex flex-col items-center pt-20 origin-top"
            >
              <AnimatePresence mode="wait">
                {isVisiting ? (
                  <motion.div
                    key="visit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col"
                  >
                    <div className="flex-1 bg-white relative">
                      <iframe 
                        src={visitUrl} 
                        className="w-full h-full border-none"
                        title="Browser Content"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 pointer-events-none border-4 border-blue-500/10" />
                      
                      {/* Overlay for sites that block iframes */}
                      <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white/80 text-xs flex items-center justify-between">
                        <span>提示：部分網站可能因安全性政策 (X-Frame-Options) 無法在視窗中顯示。</span>
                        <button 
                          onClick={() => window.open(visitUrl, '_blank')}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all"
                        >
                          在新分頁開啟
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : !isSearching ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full flex flex-col items-center"
                  >
                    {isIncognito && (
                      <div className="mb-8 flex flex-col items-center gap-4 text-purple-400">
                        <Shield size={64} />
                        <div className="text-center">
                          <h2 className="text-2xl font-bold">您已進入無痕模式</h2>
                          <p className="text-sm text-white/60">現在您可以私密地瀏覽網頁，此裝置上的其他使用者不會看到您的活動。</p>
                        </div>
                      </div>
                    )}

                    {/* Top Right Nav */}
                    <div className="absolute top-4 right-8 flex items-center gap-4 text-xs text-white/90">
                      <span className="hover:underline cursor-pointer" onClick={() => updateTabUrl('https://mail.google.com', true)}>Gmail</span>
                      <span className="hover:underline cursor-pointer" onClick={() => updateTabUrl('https://www.google.com/imghp', true)}>圖片</span>
                      <div className="relative">
                        <div 
                          className="p-2 hover:bg-white/5 rounded-full cursor-pointer"
                          onClick={() => setShowGoogleApps(!showGoogleApps)}
                        >
                          <LayoutGrid size={16} />
                        </div>
                        
                        <AnimatePresence>
                          {showGoogleApps && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute right-0 top-10 w-[300px] bg-[#202124] border border-white/10 rounded-3xl shadow-2xl p-4 z-50 grid grid-cols-3 gap-2"
                            >
                              {googleApps.map(app => (
                                <div 
                                  key={app.name}
                                  onClick={() => {
                                    updateTabUrl(app.url, true);
                                    setShowGoogleApps(false);
                                  }}
                                  className="flex flex-col items-center gap-2 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                                >
                                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                    {app.icon}
                                  </div>
                                  <span className="text-[10px]">{app.name}</span>
                                </div>
                              ))}
                              <div className="col-span-3 pt-2 mt-2 border-t border-white/10 text-center">
                                <button className="text-blue-400 text-[11px] font-medium hover:bg-blue-400/10 px-4 py-2 rounded-full transition-all">
                                  更多 Google 應用程式
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
                        <img src={auth.currentUser?.photoURL || "https://www.gstatic.com/images/branding/product/2x/avatar_square_blue_120dp.png"} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    {/* Google Logo */}
                    <div className={`text-[90px] font-semibold mb-8 tracking-tighter flex items-center ${isIncognito ? 'text-white/40' : ''}`}>
                      <span className={isIncognito ? '' : 'text-[#4285F4]'}>G</span>
                      <span className={isIncognito ? '' : 'text-[#EA4335]'}>o</span>
                      <span className={isIncognito ? '' : 'text-[#FBBC05]'}>o</span>
                      <span className={isIncognito ? '' : 'text-[#4285F4]'}>g</span>
                      <span className={isIncognito ? '' : 'text-[#34A853]'}>l</span>
                      <span className={isIncognito ? '' : 'text-[#EA4335]'}>e</span>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-[584px] space-y-6">
                      <form 
                        onSubmit={handleSearch}
                        className={`w-full ${isIncognito ? 'bg-[#303134]' : 'bg-[#4d5156]'} hover:bg-[#5f6368] rounded-full px-5 py-3 flex items-center gap-4 shadow-lg transition-colors group border border-transparent focus-within:bg-[#303134] focus-within:border-white/10`}
                      >
                        <Search size={20} className="text-white/60" />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="搜尋 Google 或輸入網址"
                          className="bg-transparent outline-none flex-1 text-white text-base"
                        />
                        <div className="flex items-center gap-4">
                          <Mic size={20} className="text-blue-400 cursor-pointer" />
                          <div className="w-5 h-5 border-2 border-white/40 rounded-sm relative cursor-pointer">
                            <div className="absolute inset-1 bg-white/40 rounded-full" />
                          </div>
                        </div>
                      </form>
                      
                      <div className="flex justify-center gap-3">
                        <button onClick={handleSearch} className="px-4 py-2 bg-[#303134] hover:bg-[#3c4043] border border-transparent hover:border-white/10 rounded text-sm text-white/90 transition-all">Google 搜尋</button>
                        <button className="px-4 py-2 bg-[#303134] hover:bg-[#3c4043] border border-transparent hover:border-white/10 rounded text-sm text-white/90 transition-all">好手氣</button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-[#202124] overflow-y-auto"
            >
              {/* Results Header */}
              <div className="sticky top-0 bg-[#202124] border-b border-white/10 px-8 py-4 flex items-center gap-8 z-10">
                <div className="text-2xl font-bold flex items-center cursor-pointer" onClick={handleHome}>
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </div>
                <form onSubmit={handleSearch} className="flex-1 max-w-[690px] bg-[#303134] rounded-full px-5 py-2 flex items-center gap-4 shadow-md border border-white/10">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-white text-sm"
                  />
                  <div className="flex items-center gap-3 text-white/60 border-l border-white/10 pl-3">
                    <X size={16} className="cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                    <Mic size={16} className="text-blue-400 cursor-pointer" />
                    <Search size={16} className="text-blue-400 cursor-pointer" onClick={handleSearch} />
                  </div>
                </form>
              </div>

                    {/* Results Content */}
                    <div className="max-w-[1000px] px-8 py-6 space-y-4">
                      {searchError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                          <AlertCircle size={18} />
                          <span>{searchError}</span>
                        </div>
                      )}
                      
                      <div className="text-white/40 text-sm">
                        {isAiLoading ? '正在搜尋中...' : `約有 ${Math.floor(Math.random() * 1000000000).toLocaleString()} 項結果 (搜尋時間：0.42 秒)`}
                      </div>
                      
                      {isAiLoading ? (
                        <div className="space-y-4">
                          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 animate-pulse space-y-4">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-blue-400" />
                              <div className="h-4 bg-white/10 rounded w-24" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-white/5 rounded w-full" />
                              <div className="h-4 bg-white/5 rounded w-5/6" />
                              <div className="h-4 bg-white/5 rounded w-4/6" />
                            </div>
                          </div>
                          {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2 animate-pulse">
                              <div className="h-3 bg-white/5 rounded w-1/4" />
                              <div className="h-5 bg-white/10 rounded w-1/2" />
                              <div className="h-4 bg-white/5 rounded w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : realResults.length > 0 ? (
                        <div className="space-y-4">
                          {/* AI Overview Section */}
                          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                              <Sparkles size={16} />
                              <span>AI 總覽</span>
                            </div>
                            <div className="text-white/90 leading-relaxed text-sm">
                              <Markdown>
                                {`根據您的搜尋「${searchQuery}」，Gemini 為您整理了以下重點：\n\n` + 
                                realResults.map(r => `* **${r.title}**: ${r.snippet}`).join('\n')}
                              </Markdown>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button className="text-[10px] px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">這對我有幫助</button>
                              <button className="text-[10px] px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">這沒有幫助</button>
                            </div>
                          </div>

                          {/* Standard Search Results */}
                          {realResults.map((res, i) => (
                            <div key={i} className="space-y-1 max-w-[650px] group">
                              <div className="text-xs text-white/60 flex items-center gap-2">
                                <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center text-[8px]">
                                  {res.url.includes('google') ? 'G' : res.url[8]?.toUpperCase() || 'W'}
                                </div>
                                <span>{res.url}</span>
                                <ChevronRight size={12} />
                              </div>
                              <h3 
                                onClick={() => updateTabUrl(res.url, true)}
                                className="text-xl text-[#8ab4f8] hover:underline cursor-pointer font-medium group-hover:text-[#c6dafc]"
                              >
                                {res.title}
                              </h3>
                              <p className="text-sm text-white/80 leading-relaxed">
                                {res.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/40 text-center py-20">
                          <Search size={48} className="mx-auto mb-4 opacity-20" />
                          <p>找不到相關結果</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Right Button */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="bg-[#202124] border border-white/10 rounded-2xl p-3 shadow-2xl flex gap-2"
                    >
                      {themeColors.map(c => (
                        <button 
                          key={c.color}
                          onClick={() => {
                            setThemeColor(c.color);
                            setShowColorPicker(false);
                          }}
                          className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="bg-[#202124] hover:bg-[#303134] text-white/80 text-[11px] px-3 py-2 rounded-full flex items-center gap-2 border border-white/10 transition-colors"
                >
                  <SettingsIcon size={14} />
                  <span>自訂 Chrome</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-[300px] bg-[#202124] border-l border-white/10 flex flex-col shadow-2xl z-50 absolute right-0 top-0 bottom-0"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#292a2d]">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-blue-400" />
                  <span className="text-sm font-bold">瀏覽紀錄</span>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {historyItems.length === 0 ? (
                  <div className="p-8 text-center text-white/40 text-xs">
                    尚無瀏覽紀錄
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <div 
                      key={item.id}
                      className="group p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => updateTabUrl(item.url, true)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate text-white/90">{item.title || '無標題'}</div>
                        <div className="text-[9px] truncate text-white/40">{item.url}</div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Developer Tools Panel */}
        <AnimatePresence>
          {showDevTools && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-[400px] bg-[#202124] border-l border-white/10 flex flex-col shadow-2xl z-50 absolute right-0 top-0 bottom-0"
            >
              <div className="flex items-center justify-between p-2 border-b border-white/10 bg-[#292a2d]">
                <div className="flex gap-1">
                  {(['console', 'elements', 'network'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDevToolsTab(tab)}
                      className={`px-3 py-1 text-[11px] font-medium rounded capitalize transition-colors ${devToolsTab === tab ? 'bg-blue-500 text-white' : 'text-white/60 hover:bg-white/5'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowDevTools(false)} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
                {devToolsTab === 'console' && (
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex gap-2 border-b border-white/5 pb-1 ${log.type === 'warn' ? 'text-yellow-400 bg-yellow-400/5' : log.type === 'error' ? 'text-red-400 bg-red-400/5' : 'text-white/80'}`}>
                        <span className="text-white/20">[{log.time}]</span>
                        <span className="font-bold uppercase w-12 flex-shrink-0">{log.type}:</span>
                        <span className="break-all">{log.msg}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 text-blue-400 pt-2">
                      <span>&gt;</span>
                      <input className="bg-transparent outline-none flex-1" placeholder="Type command..." />
                    </div>
                  </div>
                )}
                {devToolsTab === 'elements' && (
                  <div className="text-blue-300 space-y-1">
                    <div>&lt;!DOCTYPE html&gt;</div>
                    <div className="pl-2">&lt;html lang="zh-TW"&gt;</div>
                    <div className="pl-4 text-purple-300">&lt;head&gt;...&lt;/head&gt;</div>
                    <div className="pl-4">&lt;body class="google-home"&gt;</div>
                    <div className="pl-6">&lt;div id="viewport"&gt;</div>
                    <div className="pl-8 text-yellow-200">&lt;header&gt;...&lt;/header&gt;</div>
                    <div className="pl-8 text-yellow-200">&lt;main&gt;...&lt;/main&gt;</div>
                    <div className="pl-6">&lt;/div&gt;</div>
                    <div className="pl-4">&lt;/body&gt;</div>
                    <div className="pl-2">&lt;/html&gt;</div>
                  </div>
                )}
                {devToolsTab === 'network' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-white/40 border-b border-white/10">
                        <th className="font-normal py-1">Name</th>
                        <th className="font-normal py-1">Status</th>
                        <th className="font-normal py-1">Type</th>
                        <th className="font-normal py-1">Time</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      <tr><td className="py-1 text-blue-400">google-logo.png</td><td>200</td><td>png</td><td>12ms</td></tr>
                      <tr><td className="py-1 text-blue-400">search-api</td><td>200</td><td>fetch</td><td>45ms</td></tr>
                      <tr><td className="py-1 text-blue-400">analytics.js</td><td>200</td><td>script</td><td>8ms</td></tr>
                      <tr><td className="py-1 text-blue-400">favicon.ico</td><td>404</td><td>ico</td><td>2ms</td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface SettingsProps {
  wallpaper: string;
  onWallpaperChange: (url: string) => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  saveSettings: (updates: {
    wallpaper?: string;
    deletedAppIds?: string[];
    password?: string;
    iconSize?: 'small' | 'medium' | 'large';
    showDesktopIcons?: boolean;
    autoArrange?: boolean;
    iconPositions?: Record<string, { x: number; y: number }>;
  }) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ wallpaper, onWallpaperChange, user, onLogin, onLogout, saveSettings }) => {
  const [activeSection, setActiveSection] = useState<'personalization' | 'system' | 'network' | 'accounts'>('personalization');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [wifiEnabled, setWifiEnabled] = useState(navigator.onLine);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [networkStats, setNetworkStats] = useState({
    downlink: 0,
    rtt: 0,
    type: 'unknown',
    effectiveType: 'unknown',
    ip: '正在取得...'
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        setNetworkStats(prev => ({
          ...prev,
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
          type: conn.type || 'wifi',
          effectiveType: conn.effectiveType || '4g'
        }));
      }
      setWifiEnabled(navigator.onLine);
    };

    const fetchIP = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setNetworkStats(prev => ({ ...prev, ip: data.ip }));
      } catch (e) {
        setNetworkStats(prev => ({ ...prev, ip: '無法取得' }));
      }
    };

    updateNetworkInfo();
    fetchIP();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (conn) conn.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: '密碼不一致', type: 'error' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMessage({ text: '密碼太短', type: 'error' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage(null);
    try {
      await saveSettings({ password: newPassword });
      
      // Also update public profile
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await setDoc(doc(db, `public_users/${user.uid}`), { hasPassword: true }, { merge: true });
      
      setPasswordMessage({ text: '密碼更新成功', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMessage({ text: '更新失敗', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };
  
  const wallpapers = [
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2070&auto=format&fit=crop'
  ];

  return (
    <div className={`h-full flex ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-900'}`}>
      <div className={`w-48 border-r p-4 space-y-2 ${isDarkMode ? 'bg-[#252525] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">設定</div>
        
        {[
          { id: 'personalization', name: '個人化', icon: <Palette size={16} /> },
          { id: 'system', name: '系統', icon: <Monitor size={16} /> },
          { id: 'network', name: '網路', icon: <Globe size={16} /> },
          { id: 'accounts', name: '帳戶', icon: <User size={16} /> },
        ].map(item => (
          <div 
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              activeSection === item.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {item.icon}
            {item.name}
          </div>
        ))}
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'personalization' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">個人化</h2>
              <p className="text-sm opacity-50">自訂您的桌面外觀與風格</p>
            </div>

            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-40">背景圖片</h3>
              <div className="grid grid-cols-3 gap-4">
                {wallpapers.map((url, i) => (
                  <div 
                    key={i}
                    onClick={() => onWallpaperChange(url)}
                    className={`aspect-video rounded-xl border-2 cursor-pointer overflow-hidden transition-all relative group ${
                      wallpaper === url ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img src={url} alt="Wallpaper" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {wallpaper === url && (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <div className="bg-blue-500 text-white p-1 rounded-full">
                          <Star size={12} fill="currentColor" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-40">色彩模式</h3>
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Brain size={20} />
                  </div>
                  <div>
                    <div className="font-bold">深色模式</div>
                    <div className="text-xs opacity-50">減少眼睛疲勞並節省電量</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'system' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">系統資訊</h2>
              <p className="text-sm opacity-50">檢視您的裝置規格與狀態</p>
            </div>

            <div className={`grid grid-cols-2 gap-4`}>
              {[
                { label: '作業系統', value: 'WinWeb OS v2.5.0', icon: <Monitor size={16} /> },
                { label: '處理器', value: 'Gemini AI Engine', icon: <Brain size={16} /> },
                { label: '記憶體', value: '16.0 GB (虛擬)', icon: <Activity size={16} /> },
                { label: '儲存空間', value: '512 GB SSD (雲端)', icon: <Folder size={16} /> },
              ].map((spec, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-blue-400 mb-2">{spec.icon}</div>
                  <div className="text-xs opacity-50 font-bold uppercase tracking-widest">{spec.label}</div>
                  <div className="font-bold">{spec.value}</div>
                </div>
              ))}
            </div>

            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-40">效能模式</h3>
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <Activity size={20} className="text-emerald-400" />
                  <div>
                    <div className="font-bold">高效能模式</div>
                    <div className="text-xs opacity-50">優先考慮流暢度與反應速度</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">已開啟</div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'network' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">網路與網際網路</h2>
              <p className="text-sm opacity-50">管理您的連線與網路設定</p>
            </div>

            <section className="space-y-4">
              <div className={`p-6 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${wifiEnabled ? 'bg-blue-500 text-white' : 'bg-gray-500/20 text-gray-500'}`}>
                    <Wifi size={24} />
                  </div>
                  <div>
                    <div className="font-bold">Wi-Fi</div>
                    <div className="text-xs opacity-50">{wifiEnabled ? `已連線 (${networkStats.effectiveType.toUpperCase()})` : '已中斷連線'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${wifiEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${wifiEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {wifiEnabled && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-40 px-2 flex justify-between">
                    <span>可用網路 (模擬掃描)</span>
                    <span className="text-[8px] normal-case">瀏覽器限制無法掃描真實 SSID</span>
                  </h4>
                  {[
                    { name: 'WinWeb-HighSpeed', signal: 4, secure: true, connected: true },
                    { name: 'Guest-Network', signal: 3, secure: true, connected: false },
                    { name: 'Coffee-Shop-Free', signal: 2, secure: false, connected: false },
                  ].map((net, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors ${net.connected ? 'bg-white/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <Signal size={16} className={net.signal > 2 ? 'text-emerald-400' : 'text-yellow-400'} />
                        <span className="text-sm font-medium">{net.name}</span>
                        {net.secure && <Lock size={12} className="opacity-40" />}
                      </div>
                      {net.connected && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">已連線</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`p-6 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-40">連線內容 (真實資訊)</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="opacity-50 text-xs">外部 IP 位址</div>
                  <div className="font-mono">{networkStats.ip}</div>
                </div>
                <div>
                  <div className="opacity-50 text-xs">延遲 (RTT)</div>
                  <div className="font-mono">{networkStats.rtt} ms</div>
                </div>
                <div>
                  <div className="opacity-50 text-xs">下載速度 (預估)</div>
                  <div className="font-mono">{networkStats.downlink} Mbps</div>
                </div>
                <div>
                  <div className="opacity-50 text-xs">網路類型</div>
                  <div className="font-mono">{networkStats.type === 'unknown' ? '乙太網路/Wi-Fi' : networkStats.type}</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'accounts' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">帳戶設定</h2>
              <p className="text-sm opacity-50">管理您的使用者帳戶與安全性</p>
            </div>

            <section className={`p-8 rounded-3xl border flex flex-col items-center text-center space-y-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className="relative">
                <div className={`w-24 h-24 rounded-full border-4 border-blue-500/20 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center`}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                </div>
                {user && (
                  <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-[#1e1e1e]">
                    <CheckCircle2 size={12} />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{user?.displayName || '訪客使用者'}</h3>
                <p className="text-sm opacity-50">{user?.email || '尚未登入 WinWeb 帳戶'}</p>
              </div>

              <div className="flex gap-3 pt-2">
                {user ? (
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold text-sm transition-all"
                  >
                    <LogOut size={16} />
                    登出帳戶
                  </button>
                ) : (
                  <button 
                    onClick={onLogin}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <LogIn size={16} />
                    登入 Google 帳戶
                  </button>
                )}
              </div>
            </section>

            {user && (
              <section className={`p-6 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3 text-blue-400">
                  <Lock size={20} />
                  <h3 className="font-bold">登入安全性</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider">設定新密碼</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="輸入新密碼"
                      className={`w-full p-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-blue-500' : 'bg-gray-100 border-gray-200 focus:border-blue-500'}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider">確認新密碼</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次輸入新密碼"
                      className={`w-full p-3 rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-blue-500' : 'bg-gray-100 border-gray-200 focus:border-blue-500'}`}
                    />
                  </div>

                  {passwordMessage && (
                    <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {passwordMessage.text}
                    </div>
                  )}

                  <button 
                    onClick={handleUpdatePassword}
                    disabled={isSavingPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSavingPassword ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield size={18} />
                        更新密碼
                      </>
                    )}
                  </button>
                  
                  <p className="text-[10px] opacity-40 text-center">設定密碼後，下次登入此帳戶時將需要輸入密碼驗證。</p>
                </div>
              </section>
            )}
          </div>
        )}

        {activeSection !== 'personalization' && activeSection !== 'system' && activeSection !== 'network' && activeSection !== 'accounts' && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <SettingsIcon size={48} className="animate-spin-slow" />
            <div className="space-y-1">
              <div className="font-bold">此功能開發中</div>
              <div className="text-xs">請在未來的更新中再次查看</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Gemini: React.FC = () => {
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'ai', 
    content: string, 
    image?: string, 
    isThinking?: boolean,
    sources?: { title: string, uri: string }[] 
  }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      setIsHistoryLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/gemini_chats`),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // For simplicity, we just load the most recent chat session
        const latestChat = snapshot.docs[0].data() as any;
        setMessages(latestChat.messages || []);
      }
      setIsHistoryLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/gemini_chats`);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const saveChatToFirestore = async (newMessages: any[]) => {
    if (!auth.currentUser) return;
    
    // We use a fixed ID for the "current" chat session for now
    const chatId = 'current_session';
    const path = `users/${auth.currentUser.uid}/gemini_chats/${chatId}`;

    try {
      await setDoc(doc(db, path), {
        id: chatId,
        uid: auth.currentUser.uid,
        messages: newMessages,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = { role: 'user' as const, content: input, image: selectedImage || undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const parts: any[] = [{ text: userMsg.content || "Analyze this image" }];
      if (userMsg.image) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: userMsg.image.split(',')[1]
          }
        });
      }

      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await aiInstance.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          thinkingConfig: useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
          tools: [{ googleSearch: {} }]
        }
      });

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources = groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || '#'
      })).filter(s => s.title && s.uri);

      const aiMsg = { 
        role: 'ai' as const, 
        content: response.text || 'No response', 
        isThinking: useThinking,
        sources: sources as any
      };
      
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      saveChatToFirestore(updatedMessages);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Failed to get response from Gemini.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (auth.currentUser) {
      const chatId = 'current_session';
      const path = `users/${auth.currentUser.uid}/gemini_chats/${chatId}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const speak = async (text: string) => {
    try {
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Gemini AI</h2>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setUseThinking(!useThinking)}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider",
              useThinking ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
            )}
          >
            <Brain size={14} />
            Thinking Mode
          </button>
          <button 
            onClick={clearChat}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all border border-transparent"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Bot size={48} className="text-blue-500" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">How can I help you today?</h3>
              <p className="text-sm max-w-[280px]">Ask me anything, generate images, or analyze code.</p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn("flex items-center gap-2 mb-1 opacity-40 text-[10px] font-bold uppercase tracking-widest", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} className="text-blue-400" />}
              <span>{msg.role === 'user' ? 'You' : 'Gemini'}</span>
            </div>
            <div className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "p-4 rounded-2xl shadow-lg",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
              )}>
                {msg.image && <img src={msg.image} className="max-w-xs rounded-lg mb-3 border border-white/10" />}
                {msg.role === 'ai' ? (
                  <div className="space-y-4">
                    <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                          <Globe size={12} />
                          <span>Sources</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, sIdx) => (
                            <a 
                              key={sIdx} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors border border-white/5 flex items-center gap-1"
                            >
                              <ExternalLink size={10} />
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
              {msg.role === 'ai' && (
                <button 
                  onClick={() => speak(msg.content)}
                  className="mt-auto p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white/60 transition-all"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col gap-2 items-start">
            <div className="flex items-center gap-2 mb-1 opacity-40 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={12} className="text-blue-400" />
              <span>Gemini</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center shadow-lg backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
        {selectedImage && (
          <div className="mb-4 relative w-20 h-20">
            <img src={selectedImage} className="w-full h-full object-cover rounded-lg border-2 border-blue-500" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all shadow-inner">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm py-2"
          />
          <button 
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className={cn(
              "p-2 rounded-xl transition-all",
              isLoading || (!input.trim() && !selectedImage) ? "text-white/10" : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
            )}
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[10px] text-white/20 mt-3">Gemini may display inaccurate info, including about people, so double-check its responses.</p>
      </div>
    </div>
  );
};

export const Creative: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'edit'>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [videoResolution, setVideoResolution] = useState('720p');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [editImage, setEditImage] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Check for API key for Image models
    if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await aiInstance.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResult(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!prompt.trim() || !editImage || isGenerating) return;

    // Check for API key for Image models
    if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data: editImage.split(',')[1], mimeType: 'image/png' } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResult(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Image Edit Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Check for API key for Veo models
    if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      let operation = await aiInstance.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: videoResolution as any,
          aspectRatio: videoAspectRatio as any
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await aiInstance.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setResult(downloadLink);
      }
    } catch (error) {
      console.error("Video Gen Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full bg-[#121212] text-white flex flex-col">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Palette size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Creative Studio</h1>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(['image', 'edit', 'video'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setResult(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              {tab === 'image' && <ImageIcon size={14} className="inline mr-2" />}
              {tab === 'edit' && <RefreshCw size={14} className="inline mr-2" />}
              {tab === 'video' && <Video size={14} className="inline mr-2" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-white/10 p-6 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'image' ? "A futuristic city at sunset..." : activeTab === 'edit' ? "Change the background to a beach..." : "A cat playing the piano..."}
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-pink-500/50 transition-colors resize-none"
            />
          </div>

          {activeTab === 'image' && (
            <>
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${aspectRatio === ratio ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Resolution</label>
                <div className="flex gap-2">
                  {['1K', '2K', '4K'].map(size => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${imageSize === size ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Source Image</label>
              <input type="file" ref={editInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setEditImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <div 
                onClick={() => editInputRef.current?.click()}
                className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
              >
                {editImage ? (
                  <img src={editImage} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Paperclip size={24} className="text-white/20" />
                    <span className="text-[10px] text-white/40">Upload Image</span>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <>
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Video Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {['16:9', '9:16'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setVideoAspectRatio(ratio)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${videoAspectRatio === ratio ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                    >
                      {ratio === '16:9' ? 'Landscape' : 'Portrait'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Resolution</label>
                <div className="flex gap-2">
                  {['720p', '1080p'].map(res => (
                    <button
                      key={res}
                      onClick={() => setVideoResolution(res)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${videoResolution === res ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => {
              if (activeTab === 'image') handleGenerateImage();
              else if (activeTab === 'edit') handleEditImage();
              else handleGenerateVideo();
            }}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${isGenerating || !prompt.trim() ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:scale-[1.02] active:scale-95 shadow-pink-500/20'}`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate {activeTab}
              </>
            )}
          </button>
        </div>

        <div className="flex-1 bg-black/50 p-12 flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-full max-h-full shadow-2xl rounded-2xl overflow-hidden border border-white/10 group"
              >
                {activeTab === 'video' ? (
                  <video src={result} controls autoPlay loop className="max-w-full max-h-[70vh]" />
                ) : (
                  <img src={result} className="max-w-full max-h-[70vh] object-contain" />
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/50 backdrop-blur-md rounded-lg hover:bg-black/70 transition-colors"><Download size={18} /></button>
                  <button onClick={() => setResult(null)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg hover:bg-black/70 transition-colors"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ) : isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Creating Magic...</h3>
                  <p className="text-sm text-white/40">Our AI is painting your imagination into reality.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-6 opacity-20"
              >
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  {activeTab === 'image' ? <ImageIcon size={64} /> : activeTab === 'edit' ? <RefreshCw size={64} /> : <Video size={64} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Ready to Create?</h3>
                  <p className="text-sm">Enter a prompt on the left to start generating.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
