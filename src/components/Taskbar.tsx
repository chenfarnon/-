import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutGrid, 
  Settings, 
  Power, 
  User,
  Monitor,
  Wifi,
  Volume2,
  Battery,
  Bluetooth,
  Plane,
  Moon,
  Accessibility,
  Radio,
  Sun,
  Layout,
  ChevronRight,
  Globe,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
import { AppConfig, WindowState } from '../types';

interface TaskbarProps {
  apps: AppConfig[];
  openWindows: WindowState[];
  onAppClick: (appId: string) => void;
  onWindowClick: (windowId: string) => void;
  onStartClick: () => void;
  user: any;
}

export const Taskbar: React.FC<TaskbarProps> = ({ apps, openWindows, onAppClick, onWindowClick, onStartClick, user }) => {
  const [time, setTime] = useState(new Date());
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-12 w-full glass-dark fixed bottom-0 left-0 flex items-center justify-between px-2 z-[9999]">
      {/* Left Section */}
      <div className="flex-1 flex items-center" />

      {/* Center Section: App Icons */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onStartClick}
          className="p-2 hover:bg-white/10 rounded transition-all active:scale-90"
        >
          <LayoutGrid size={24} className="text-blue-400" />
        </button>
        
        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        {apps.map(app => {
          const appWindows = openWindows.filter(w => w.appId === app.id);
          const isOpen = appWindows.length > 0;
          const isActive = openWindows.length > 0 && openWindows[openWindows.length - 1].appId === app.id;
          
          const handleIconClick = () => {
            if (isOpen) {
              // If multiple windows, toggle the list (handled by hover/state)
              // Or focus the last one if only one
              if (appWindows.length === 1) {
                onWindowClick(appWindows[0].id);
              } else {
                // If multiple, maybe just focus the most recent one
                onWindowClick(appWindows[appWindows.length - 1].id);
              }
            } else {
              onAppClick(app.id);
            }
          };

          return (
            <div 
              key={app.id} 
              className="relative group"
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
            >
              <button
                onClick={handleIconClick}
                className={`p-2 rounded transition-all hover:bg-white/10 active:scale-90 flex items-center justify-center ${
                  isActive ? 'bg-white/10' : ''
                }`}
              >
                <div className="text-white/90">{app.icon}</div>
              </button>
              
              {/* Grouping Indicator */}
              {isOpen && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {appWindows.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full bg-blue-400 transition-all ${
                      isActive && i === appWindows.length - 1 ? 'w-3' : 'w-1'
                    }`} />
                  ))}
                </div>
              )}

              {/* Grouped Windows Preview/List */}
              <AnimatePresence>
                {hoveredApp === app.id && isOpen && (
                  <motion.div
                    initial={{ y: 10, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 10, opacity: 0, scale: 0.9 }}
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-dark p-3 rounded-xl min-w-[180px] border border-white/20 shadow-2xl flex flex-col gap-2"
                  >
                    <div className="text-[10px] text-white/40 uppercase font-bold px-1 mb-1 flex items-center justify-between">
                      <span>{app.name}</span>
                      <span className="bg-white/10 px-1.5 rounded-full">{appWindows.length}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {appWindows.map(win => (
                        <button
                          key={win.id}
                          onClick={() => onWindowClick(win.id)}
                          className="group/item w-full text-left p-2 rounded-lg hover:bg-white/10 transition-all flex flex-col gap-2 border border-transparent hover:border-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-white/60 group-hover/item:text-blue-400 transition-colors">
                              {React.cloneElement(app.icon as React.ReactElement<any>, { size: 14 })}
                            </div>
                            <span className="text-white/90 text-xs truncate font-medium">{win.title}</span>
                          </div>
                          {/* Mock Thumbnail */}
                          <div className="h-20 w-full bg-white/5 rounded border border-white/5 overflow-hidden flex items-center justify-center relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-white/10" />
                            <div className="opacity-20 scale-150">
                              {app.icon}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Right Section: Time & System Info */}
      <div className="flex-1 flex items-center justify-end h-full">
        <div 
          onClick={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
          className={cn(
            "flex items-center gap-2 px-3 h-full hover:bg-white/10 transition-all cursor-default group",
            isQuickSettingsOpen && "bg-white/10"
          )}
        >
          <div className="flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors">
            <Wifi size={14} />
            <Volume2 size={14} />
            <Battery size={14} className="rotate-90" />
          </div>
        </div>
        
        <div 
          className="flex flex-col items-end px-3 h-full hover:bg-white/10 transition-all cursor-default justify-center group"
        >
          <span className="text-[11px] text-white/90 font-medium group-hover:text-white">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[11px] text-white/90 font-medium group-hover:text-white">
            {time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="w-1.5 h-full border-l border-white/10 hover:bg-white/10 transition-colors cursor-pointer" title="顯示桌面" />

        <QuickSettings 
          isOpen={isQuickSettingsOpen} 
          onClose={() => setIsQuickSettingsOpen(false)} 
        />
      </div>
    </div>
  );
};

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppConfig[];
  onAppClick: (appId: string) => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onLock: () => void;
  onSwitchUser: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, apps, onAppClick, user, onLogin, onLogout, onLock, onSwitchUser }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={onClose} />
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[540px] h-[600px] glass-dark rounded-xl z-[9998] p-8 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                placeholder="Search for apps, settings, and documents"
                className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white/90 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Pinned Apps */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">Pinned</span>
                <button className="text-white/60 text-xs hover:bg-white/5 px-2 py-1 rounded">All apps &gt;</button>
              </div>
              <div className="grid grid-cols-6 gap-y-6">
                {apps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => { onAppClick(app.id); onClose(); }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      {app.icon}
                    </div>
                    <span className="text-white/80 text-[11px]">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Profile & Power */}
            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
              {user ? (
                <div 
                  onClick={onLogout}
                  className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer group"
                  title="點擊登出"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <User size={18} />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">{user.displayName || '使用者'}</span>
                    <span className="text-white/40 text-[10px]">已登入</span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={onLogin}
                  className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <User size={18} />
                  </div>
                  <span className="text-white text-sm">點擊登入</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button 
                  onClick={onLock}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/80"
                  title="鎖定"
                >
                  <ShieldCheck size={18} />
                </button>
                <button 
                  onClick={onSwitchUser}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/80"
                  title="切換使用者"
                >
                  <User size={18} />
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/80"
                  title="登出"
                >
                  <Power size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({ isOpen, onClose }) => {
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(50);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(true);
  const [airplane, setAirplane] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [project, setProject] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9997]" onClick={onClose} />
          <motion.div
            initial={{ y: 100, x: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, x: 50, opacity: 0, scale: 0.95 }}
            className="fixed bottom-14 right-2 w-[360px] glass-dark rounded-2xl z-[9998] p-6 flex flex-col shadow-2xl border border-white/10 backdrop-blur-2xl"
          >
            {/* Grid Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { id: 'wifi', icon: Wifi, label: 'Wi-Fi', state: wifi, setter: setWifi, sub: 'Brads Wi-Fi' },
                { id: 'bluetooth', icon: Bluetooth, label: '藍牙', state: bluetooth, setter: setBluetooth, sub: '已連線' },
                { id: 'airplane', icon: Plane, label: '飛航模式', state: airplane, setter: setAirplane },
                { id: 'battery', icon: Battery, label: '省電模式', state: batterySaver, setter: setBatterySaver },
                { id: 'night', icon: Moon, label: '夜間光線', state: nightLight, setter: setNightLight },
                { id: 'dark', icon: Layout, label: '深色模式', state: darkMode, setter: setDarkMode },
              ].map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => item.setter(!item.state)}
                    className={cn(
                      "w-full h-12 rounded-xl flex items-center justify-center transition-all border shadow-sm",
                      item.state 
                        ? "bg-blue-500 border-blue-400 text-white shadow-blue-500/20" 
                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <item.icon size={20} className={item.id === 'battery' ? 'rotate-90' : ''} />
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] text-white/90 font-bold">{item.label}</p>
                    {item.sub && <p className="text-[8px] text-white/40 truncate w-20">{item.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-6 mb-8">
              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Sun size={12} /> 亮度</div>
                  <span>{brightness}%</span>
                </div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative group">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-lg shadow-blue-500/20" 
                    style={{ width: `${brightness}%` }}
                  />
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl pointer-events-none transition-transform group-hover:scale-110"
                    style={{ left: `calc(${brightness}% - 8px)` }}
                  />
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Volume2 size={12} /> 音量</div>
                  <span>{volume}%</span>
                </div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative group">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-lg shadow-blue-500/20" 
                    style={{ width: `${volume}%` }}
                  />
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl pointer-events-none transition-transform group-hover:scale-110"
                    style={{ left: `calc(${volume}% - 8px)` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Battery size={14} className="rotate-90 text-green-400" />
                  <span className="text-xs font-bold">75%</span>
                </div>
                <div className="text-[10px] text-white/40 font-medium">剩餘 4 小時 12 分鐘</div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/10">
                  <Settings size={18} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/10">
                  <Power size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
