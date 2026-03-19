import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Calculator as CalcIcon, 
  Globe,
  Settings as SettingsIcon,
  Sparkles,
  Palette,
  Trash2,
  Monitor,
  FolderOpen,
  ExternalLink,
  LogIn,
  Check,
  Link as LinkIcon
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
import { Taskbar, StartMenu } from './components/Taskbar';
import { Window } from './components/Window';
import { Notepad, Calculator, Browser, Settings, Gemini, Creative } from './components/Apps';
import { LoginScreen } from './components/LoginScreen';
import { AppConfig, WindowState, AppId } from './types';
import { auth, onAuthStateChanged, FirebaseUser, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, limit } from 'firebase/firestore';

const APPS: AppConfig[] = [
  { id: 'notepad', name: 'Notepad', icon: <FileText size={24} />, component: <Notepad /> },
  { id: 'calculator', name: 'Calculator', icon: <CalcIcon size={24} />, component: <Calculator /> },
  { id: 'browser', name: 'Browser', icon: <Globe size={24} />, component: <Browser /> },
  { id: 'gemini', name: 'Gemini', icon: <Sparkles size={24} className="text-blue-400" />, component: <Gemini /> },
  { id: 'creative', name: 'Creative', icon: <Palette size={24} className="text-pink-400" />, component: <Creative /> },
  { id: 'settings', name: 'Settings', icon: <SettingsIcon size={24} />, component: <Settings wallpaper="" onWallpaperChange={() => {}} user={null} onLogin={() => {}} onLogout={() => {}} saveSettings={async (updates) => {}} /> },
];

export default function App() {
  const [openWindows, setOpenWindows] = useState<WindowState[]>([]);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [zIndexCounter, setZIndexCounter] = useState(10);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop');
  const [deletedAppIds, setDeletedAppIds] = useState<string[]>([]);
  const [publicUsers, setPublicUsers] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'desktop' | 'app', targetId?: string } | null>(null);
  const [iconSize, setIconSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showDesktopIcons, setShowDesktopIcons] = useState(true);
  const [autoArrange, setAutoArrange] = useState(true);
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});

  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        setIsLocked(true);
        // Reset local state on logout
        setWallpaper('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop');
        setDeletedAppIds([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync settings with Firestore
  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, `users/${user.uid}/settings/desktop`);
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.wallpaper) setWallpaper(data.wallpaper);
        if (data.deletedAppIds) setDeletedAppIds(data.deletedAppIds);
        if (data.iconSize) setIconSize(data.iconSize);
        if (data.showDesktopIcons !== undefined) setShowDesktopIcons(data.showDesktopIcons);
        if (data.autoArrange !== undefined) setAutoArrange(data.autoArrange);
        if (data.iconPositions) setIconPositions(data.iconPositions);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/settings/desktop`);
    });

    return () => unsubscribe();
  }, [user]);

  // Audio Driver Warm-up: Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudioDriver = async () => {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        console.log("System Audio Driver: Warmed up and ready.");
      }
    };
    window.addEventListener('click', initAudioDriver, { once: true });
    window.addEventListener('keydown', initAudioDriver, { once: true });
    return () => {
      window.removeEventListener('click', initAudioDriver);
      window.removeEventListener('keydown', initAudioDriver);
    };
  }, []);

  // Fetch public users for login screen
  useEffect(() => {
    const q = query(collection(db, 'public_users'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setPublicUsers(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'public_users');
    });
    return () => unsubscribe();
  }, []);

  const saveSettings = async (updates: { 
    wallpaper?: string, 
    deletedAppIds?: string[], 
    password?: string,
    iconSize?: 'small' | 'medium' | 'large',
    showDesktopIcons?: boolean,
    autoArrange?: boolean,
    iconPositions?: Record<string, { x: number, y: number }>
  }) => {
    if (!user) return;
    const settingsRef = doc(db, `users/${user.uid}/settings/desktop`);
    const userRef = doc(db, `users/${user.uid}`);
    const publicUserRef = doc(db, `public_users/${user.uid}`);
    
    try {
      const { password, ...otherUpdates } = updates;
      
      if (password !== undefined) {
        await setDoc(userRef, { password }, { merge: true });
        await setDoc(publicUserRef, { hasPassword: !!password }, { merge: true });
      }

      if (Object.keys(otherUpdates).length > 0) {
        await setDoc(settingsRef, {
          ...otherUpdates,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/settings/desktop`);
    }
  };

  const handleIconDragEnd = (id: string, info: any) => {
    if (autoArrange) return;
    
    // Snap to grid
    const grid = 20;
    const x = Math.round(info.point.x / grid) * grid;
    const y = Math.round(info.point.y / grid) * grid;
    
    const newPositions = { ...iconPositions, [id]: { x, y } };
    setIconPositions(newPositions);
    saveSettings({ iconPositions: newPositions });
  };

  const copyAppLink = (id: string) => {
    const url = `${window.location.origin}?app=${id}`;
    navigator.clipboard.writeText(url);
    // In a real app we'd show a toast
  };

  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'small': return 'w-16 h-16';
      case 'large': return 'w-28 h-28';
      default: return 'w-24 h-24';
    }
  };

  const getIconImageSize = () => {
    switch (iconSize) {
      case 'small': return 20;
      case 'large': return 32;
      default: return 24;
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync user profile to Firestore
      const userRef = doc(db, `users/${user.uid}`);
      const publicUserRef = doc(db, `public_users/${user.uid}`);
      
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        role: 'user' // Default role
      }, { merge: true });

      await setDoc(publicUserRef, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        hasPassword: false // Default
      }, { merge: true });

    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert("登入視窗被瀏覽器封鎖了，請允許彈出視窗後再試一次。");
      } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLock = () => {
    setIsLocked(true);
    setIsStartOpen(false);
  };

  const handleSwitchUser = async () => {
    try {
      await signOut(auth);
      setOpenWindows([]);
      setIsStartOpen(false);
      setIsLocked(true);
    } catch (error) {
      console.error('Switch user error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpenWindows([]);
      setIsStartOpen(false);
      setIsLocked(true);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const systemIcons = [
    { id: 'pc', name: '本機', icon: <Monitor size={32} className="text-blue-400" /> },
    { id: 'recycle', name: '資源回收筒', icon: <Trash2 size={32} className="text-white/80" /> },
    { id: 'files', name: '檔案總管', icon: <FolderOpen size={32} className="text-yellow-400" /> },
  ];

  const focusWindow = useCallback((id: string) => {
    setZIndexCounter(prev => prev + 1);
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: zIndexCounter + 1, isMinimized: false } : w
    ));
  }, [zIndexCounter]);

  const openApp = (appId: AppId, forceNew = false) => {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;

    if (!forceNew) {
      const existing = openWindows.find(w => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        setIsStartOpen(false);
        return;
      }
    }

    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      appId: app.id,
      title: `${app.name} ${openWindows.filter(w => w.appId === appId).length + 1}`,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: zIndexCounter + 1
    };

    setZIndexCounter(prev => prev + 1);
    setOpenWindows(prev => [...prev, newWindow]);
    setIsStartOpen(false);
  };

  const closeWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
  };

  const deleteApp = (id: string) => {
    const newIds = [...deletedAppIds, id];
    setDeletedAppIds(newIds);
    saveSettings({ deletedAppIds: newIds });
    setContextMenu(null);
  };

  const restoreApp = (id: string) => {
    const newIds = deletedAppIds.filter(appId => appId !== id);
    setDeletedAppIds(newIds);
    saveSettings({ deletedAppIds: newIds });
    setContextMenu(null);
  };

  const emptyRecycleBin = () => {
    setDeletedAppIds([]);
    saveSettings({ deletedAppIds: [] });
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'desktop' | 'app', targetId?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, targetId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const toggleMinimize = (id: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  const toggleMaximize = (id: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  };

  const visibleApps = APPS.filter(app => !deletedAppIds.includes(app.id));
  const deletedApps = APPS.filter(app => deletedAppIds.includes(app.id));

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen bg-[#004275] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white font-light tracking-widest">WinWeb 啟動中</span>
        </div>
      </div>
    );
  }

  const handleEnter = () => {
    // Advanced Audio Engine: Direct connection to system audio buffer
    const playStartupSound = async () => {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log("Connecting to system audio driver...");
      
      const urls = [
        'https://www.winhistory.de/more/winstart/mp3/winxp.mp3',
        'https://archive.org/download/WindowsXPStartupSound/Windows%20XP%20Startup.mp3',
        'https://cdn.jsdelivr.net/gh/yisibl/windows-sounds/Windows%20XP/Windows%20XP%20Startup.wav'
      ];

      let success = false;
      for (const url of urls) {
        try {
          // Attempt 1: Web Audio API (Fetch + Decode)
          const response = await fetch(url);
          if (!response.ok) throw new Error("Network error");
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(0);
          
          success = true;
          console.log("Audio driver: Connected via Web Audio API.");
          break;
        } catch (e) {
          console.warn(`Audio driver: Source ${url} failed, trying fallback...`);
          // Attempt 2: Simple Audio Element
          try {
            const audio = new Audio(url);
            audio.volume = 0.4;
            audio.crossOrigin = "anonymous";
            await audio.play();
            success = true;
            console.log("Audio driver: Connected via Legacy Audio Interface.");
            break;
          } catch (innerE) {
            // Silently continue to next URL
          }
        }
      }

      // Fallback: If all network sources fail, manually synthesize a high-quality "System Chime"
      // This bypasses all network/file issues and talks directly to the sound card hardware
      if (!success) {
        console.log("Audio driver: Network sources blocked. Using internal frequency synthesizer.");
        
        const playChime = (freq: number, startTime: number, duration: number, volume = 0.1) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.01, startTime + duration);
          
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(volume, startTime + 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(g);
          g.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Harmonized Windows XP-style Chime (Eb Major Arpeggio with soft attack)
        const now = ctx.currentTime;
        // The XP sound is characterized by a lush, orchestral feel.
        // We simulate the 4-note arpeggio: Eb3, Bb3, Eb4, Ab4 (approximate)
        playChime(155.56, now, 4.0, 0.06); // Eb3 (Deep base)
        playChime(233.08, now + 0.15, 4.0, 0.05); // Bb3
        playChime(311.13, now + 0.3, 4.0, 0.05); // Eb4
        playChime(415.30, now + 0.45, 4.5, 0.07); // Ab4
        
        // Add a "shimmer" layer
        playChime(622.25, now + 0.6, 5.0, 0.03); // Eb5
        playChime(830.61, now + 0.75, 5.0, 0.02); // Ab5
      }
    };

    setShowWelcome(true);
    
    // Play sound immediately when entering "Welcome" screen
    playStartupSound().catch(e => {
      console.warn("Audio driver: Final connection attempt failed.", e);
    });

    setTimeout(() => {
      setShowWelcome(false);
      setIsLocked(false);
    }, 2000);
  };

  if (isLocked) {
    return (
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="User" 
                  className="w-24 h-24 rounded-full border-2 border-white/20 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white/20 shadow-2xl">
                  <Monitor size={48} />
                </div>
              )}
              <div className="text-center">
                <h1 className="text-4xl font-light tracking-tight mb-2">歡迎</h1>
                <p className="text-xl text-white/60 font-medium">{user?.displayName || '使用者'}</p>
              </div>
              <div className="mt-8">
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full bg-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <LoginScreen 
              user={user} 
              publicUsers={publicUsers}
              onLogin={handleLogin} 
              onEnter={handleEnter}
              isLoggingIn={isLoggingIn}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div 
      id="desktop-bg"
      ref={desktopRef}
      onClick={closeContextMenu}
      onContextMenu={(e) => handleContextMenu(e, 'desktop')}
      className="h-screen w-screen overflow-hidden relative bg-cover bg-center transition-all duration-500 select-none flex flex-col"
      style={{ backgroundImage: `url("${wallpaper}")` }}
    >
      {/* Desktop Icons */}
      {showDesktopIcons && (
        <div className={cn(
          "p-4 gap-2 w-fit flex-1 overflow-hidden",
          autoArrange ? "grid grid-flow-col grid-rows-[repeat(auto-fill,100px)]" : "relative w-full h-full"
        )}>
          {/* System Icons */}
          {systemIcons.map(icon => (
            <motion.div
              key={icon.id}
              drag={!autoArrange}
              dragMomentum={false}
              onDragEnd={(_, info) => handleIconDragEnd(icon.id, info)}
              initial={autoArrange ? false : (iconPositions[icon.id] || { x: 0, y: 0 })}
              animate={autoArrange ? {} : (iconPositions[icon.id] || { x: 0, y: 0 })}
              onClick={() => {
                if (icon.id === 'files') openApp('notepad');
                else if (icon.id === 'pc') openApp('settings');
                else if (icon.id === 'recycle') {
                  alert(`資源回收筒中有 ${deletedAppIds.length} 個項目`);
                }
              }}
              onContextMenu={(e) => {
                if (icon.id === 'recycle') {
                  e.stopPropagation();
                  handleContextMenu(e, 'app', 'recycle');
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 transition-all group cursor-default active:bg-white/20",
                getIconSizeClass(),
                !autoArrange && "absolute"
              )}
              style={!autoArrange ? { left: iconPositions[icon.id]?.x, top: iconPositions[icon.id]?.y } : {}}
            >
              <div className="text-white drop-shadow-lg group-active:scale-90 transition-transform">
                {React.cloneElement(icon.icon as React.ReactElement<any>, { size: getIconImageSize() + 8 })}
              </div>
              <span className="text-white text-[11px] drop-shadow-md font-medium text-center leading-tight">
                {icon.name}
              </span>
            </motion.div>
          ))}

          {/* App Icons */}
          {visibleApps.map(app => (
            <motion.div
              key={app.id}
              drag={!autoArrange}
              dragMomentum={false}
              onDragEnd={(_, info) => handleIconDragEnd(app.id, info)}
              initial={autoArrange ? false : (iconPositions[app.id] || { x: 0, y: 0 })}
              animate={autoArrange ? {} : (iconPositions[app.id] || { x: 0, y: 0 })}
              onClick={() => openApp(app.id)}
              onContextMenu={(e) => {
                e.stopPropagation();
                handleContextMenu(e, 'app', app.id);
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 transition-all group cursor-default active:bg-white/20",
                getIconSizeClass(),
                !autoArrange && "absolute"
              )}
              style={!autoArrange ? { left: iconPositions[app.id]?.x, top: iconPositions[app.id]?.y } : {}}
            >
              <div className="text-white drop-shadow-lg group-active:scale-90 transition-transform">
                {React.cloneElement(app.icon as React.ReactElement<any>, { size: getIconImageSize() + 8 })}
              </div>
              <span className="text-white text-[11px] drop-shadow-md font-medium text-center leading-tight">
                {app.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bg-white/80 backdrop-blur-xl border border-black/10 shadow-2xl rounded-lg p-1.5 z-[9999] min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'desktop' ? (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] text-black/40 uppercase font-bold tracking-wider">檢視</div>
                <button 
                  onClick={() => { setIconSize('large'); saveSettings({ iconSize: 'large' }); closeContextMenu(); }}
                  className={cn("w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between", iconSize === 'large' && "bg-blue-500/10")}
                >
                  <span>大圖示</span>
                  {iconSize === 'large' && <Check size={12} />}
                </button>
                <button 
                  onClick={() => { setIconSize('medium'); saveSettings({ iconSize: 'medium' }); closeContextMenu(); }}
                  className={cn("w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between", iconSize === 'medium' && "bg-blue-500/10")}
                >
                  <span>中圖示</span>
                  {iconSize === 'medium' && <Check size={12} />}
                </button>
                <button 
                  onClick={() => { setIconSize('small'); saveSettings({ iconSize: 'small' }); closeContextMenu(); }}
                  className={cn("w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between", iconSize === 'small' && "bg-blue-500/10")}
                >
                  <span>小圖示</span>
                  {iconSize === 'small' && <Check size={12} />}
                </button>
                <div className="h-px bg-black/5 my-1" />
                <button 
                  onClick={() => { setAutoArrange(!autoArrange); saveSettings({ autoArrange: !autoArrange }); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between"
                >
                  <span>自動排列圖示</span>
                  {autoArrange && <Check size={12} />}
                </button>
                <button 
                  onClick={() => { setShowDesktopIcons(!showDesktopIcons); saveSettings({ showDesktopIcons: !showDesktopIcons }); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between"
                >
                  <span>顯示桌面圖示</span>
                  {showDesktopIcons && <Check size={12} />}
                </button>
                <div className="h-px bg-black/5 my-1" />
                <button 
                  onClick={() => { setWallpaper('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop'); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between"
                >
                  <span>更換桌布</span>
                  <Palette size={12} />
                </button>
                <button 
                  onClick={() => { openApp('settings'); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center justify-between"
                >
                  <span>個人化設定</span>
                  <SettingsIcon size={12} />
                </button>
              </div>
            ) : (
              <div className="py-1">
                <button 
                  onClick={() => { openApp(contextMenu.targetId as AppId); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded"
                >
                  開啟
                </button>
                <button 
                  onClick={() => { copyAppLink(contextMenu.targetId!); closeContextMenu(); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-500 hover:text-white rounded flex items-center gap-2"
                >
                  <LinkIcon size={12} />
                  複製連結
                </button>
                <div className="h-px bg-black/5 my-1" />
                {contextMenu.targetId === 'recycle' ? (
                  <button 
                    onClick={() => { emptyRecycleBin(); closeContextMenu(); }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-500 hover:text-white rounded flex items-center justify-between"
                  >
                    <span>清理資源回收筒</span>
                    <Trash2 size={12} />
                  </button>
                ) : (
                  <button 
                    onClick={() => { deleteApp(contextMenu.targetId!); closeContextMenu(); }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-500 hover:text-white rounded flex items-center justify-between"
                  >
                    <span>刪除</span>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Windows */}
      {openWindows.map(window => (
        <Window
          key={window.id}
          win={window}
          desktopRef={desktopRef}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => toggleMinimize(window.id)}
          onMaximize={() => toggleMaximize(window.id)}
          onFocus={() => focusWindow(window.id)}
        >
          {window.appId === 'settings' 
            ? <Settings 
                wallpaper={wallpaper} 
                onWallpaperChange={(url) => {
                  setWallpaper(url);
                  saveSettings({ wallpaper: url });
                }} 
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                saveSettings={saveSettings}
              />
            : APPS.find(a => a.id === window.appId)?.component}
        </Window>
      ))}

      {/* Taskbar & Start Menu */}
      <StartMenu 
        isOpen={isStartOpen} 
        onClose={() => setIsStartOpen(false)} 
        apps={APPS}
        onAppClick={(id) => openApp(id as AppId)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onLock={handleLock}
        onSwitchUser={handleSwitchUser}
      />
      <Taskbar 
        apps={APPS} 
        openWindows={openWindows}
        onAppClick={(id) => openApp(id as AppId)}
        onWindowClick={(id) => focusWindow(id)}
        onStartClick={() => setIsStartOpen(!isStartOpen)}
        user={user}
      />
    </div>
  );
}
