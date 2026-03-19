import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Power, 
  Accessibility, 
  Wifi, 
  LogIn,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { FirebaseUser } from '../firebase';

interface LoginScreenProps {
  user: FirebaseUser | null;
  publicUsers: any[];
  onLogin: () => void;
  onEnter: () => void;
  isLoggingIn: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ user, publicUsers, onLogin, onEnter, isLoggingIn }) => {
  const [time, setTime] = useState(new Date());
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user && !selectedUser) {
      setSelectedUser({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  const handleEnter = async () => {
    if (!selectedUser) return;
    
    // If selecting a different user than the one logged in to Firebase
    if (user?.uid !== selectedUser.uid) {
      onLogin();
      return;
    }

    // If user has a password set, verify it
    if (selectedUser.hasPassword) {
      setIsVerifying(true);
      setError(null);
      try {
        // In a real app, we'd use a secure function or check a hash
        // For this demo, we fetch the private user doc to check the password
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const userDoc = await getDoc(doc(db, `users/${user.uid}`));
        const userData = userDoc.data();
        
        if (userData?.password === passwordInput) {
          onEnter();
        } else {
          setError('密碼錯誤');
        }
      } catch (err) {
        console.error(err);
        setError('驗證失敗');
      } finally {
        setIsVerifying(false);
      }
    } else {
      onEnter();
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#004275] flex flex-col items-center justify-center font-sans">
      {/* Background Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-110 blur-[2px]"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop")' }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Clock Overlay (Initial state before click/interaction) */}
      <AnimatePresence mode="wait">
        {!showPassword ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -200 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={() => setShowPassword(true)}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-pointer bg-black/10 backdrop-blur-[1px]"
          >
            <div className="text-center text-white drop-shadow-2xl select-none">
              <div className="text-[120px] font-light leading-none tracking-tighter">
                {formatTime(time)}
              </div>
              <div className="text-2xl font-light mt-2">
                {formatDate(time)}
              </div>
            </div>
            <div className="absolute bottom-12 text-white/60 text-sm animate-bounce">
              點擊或按任意鍵以登入
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          >
            {/* Center Content (Login Form) */}
            <div className="flex flex-col items-center gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/10 bg-gray-500/50 backdrop-blur-md flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 duration-500">
                  {selectedUser?.photoURL ? (
                    <img src={selectedUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={80} className="text-white/80" />
                  )}
                </div>
                {selectedUser?.uid === user?.uid && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                    <ShieldCheck size={20} />
                  </div>
                )}
              </div>

              {/* User Name */}
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-light text-white drop-shadow-lg">
                  {selectedUser?.displayName || '訪客'}
                </h1>
                {selectedUser?.uid === user?.uid && user?.email && (
                  <p className="text-white/60 text-sm font-medium">{user.email}</p>
                )}
              </div>

              {/* Password Input (if applicable) */}
              {selectedUser?.hasPassword && selectedUser?.uid === user?.uid && (
                <div className="w-64 space-y-2">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="輸入密碼"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                  />
                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4">
                {(!user || selectedUser?.uid !== user?.uid) ? (
                  <button
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="px-10 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-md text-sm font-medium transition-all active:scale-95 flex items-center gap-2 group"
                  >
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                    )}
                    <span>{selectedUser ? `以 ${selectedUser.displayName} 登入` : '使用 Google 帳號登入'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEnter}
                    disabled={isVerifying}
                    className="px-12 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-md text-sm font-medium transition-all active:scale-95 flex items-center gap-2 group"
                  >
                    {isVerifying ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>登入</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Left: User List */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-3 max-h-[40vh] overflow-y-auto no-scrollbar p-2">
              {publicUsers.map((u) => (
                <div 
                  key={u.uid}
                  onClick={() => {
                    setSelectedUser(u);
                    setError(null);
                    setPasswordInput('');
                  }}
                  className={`flex items-center gap-3 p-2 pr-6 rounded-lg transition-all cursor-pointer border ${
                    selectedUser?.uid === u.uid 
                      ? 'bg-white/20 border-white/30 backdrop-blur-md scale-105' 
                      : 'bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} className="text-white/80" />
                    )}
                  </div>
                  <div className="text-white">
                    <div className="text-xs font-bold">{u.displayName}</div>
                    {u.uid === user?.uid && <div className="text-[10px] opacity-60">已登入</div>}
                  </div>
                </div>
              ))}
              
              {/* Add Account Button */}
              <div 
                onClick={onLogin}
                className="flex items-center gap-3 p-2 pr-6 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <LogIn size={20} className="text-white/80" />
                </div>
                <div className="text-white">
                  <div className="text-xs font-bold">新增帳戶</div>
                </div>
              </div>
            </div>

            {/* Bottom Right: System Icons */}
            <div className="absolute bottom-8 right-8 flex items-center gap-6 text-white/80">
              <button className="hover:text-white transition-colors"><Wifi size={20} /></button>
              <button className="hover:text-white transition-colors"><Accessibility size={20} /></button>
              <button className="hover:text-white transition-colors"><Power size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
