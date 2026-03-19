import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { WindowState } from '../types';

interface WindowProps {
  win: WindowState;
  desktopRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const Window: React.FC<WindowProps> = ({
  win,
  desktopRef,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  
  // Initial center position
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? (window.innerWidth - 600) / 2 : 0,
    y: typeof window !== 'undefined' ? (window.innerHeight - 400 - 48) / 2 : 0
  }));

  if (win.isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, x: position.x, y: position.y }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: win.isMaximized ? 0 : position.x,
        y: win.isMaximized ? 0 : position.y,
        width: win.isMaximized ? "100vw" : "600px",
        height: win.isMaximized ? "calc(100vh - 48px)" : "400px",
      }}
      exit={{ scale: 0.9, opacity: 0 }}
      drag={!win.isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={desktopRef}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        setPosition(prev => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y
        }));
      }}
      onMouseDown={onFocus}
      className={cn(
        "absolute shadow-2xl overflow-hidden flex flex-col rounded-lg border border-white/20 bg-white/80 backdrop-blur-xl",
        win.isMaximized && "top-0 left-0 !transform-none rounded-none"
      )}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ zIndex: win.isMaximized ? 5000 : win.zIndex }}
    >
      {/* Drag Overlay - covers entire window during drag to prevent iframe interference */}
      {isDragging && <div className="absolute inset-0 z-[60] cursor-grabbing" />}
      {/* Title Bar */}
      <div 
        className="h-10 flex items-center justify-between px-4 bg-white/50 border-b border-black/5 cursor-default select-none"
        onDoubleClick={onMaximize}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="text-sm font-medium text-gray-700">{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="p-1.5 hover:bg-black/5 rounded transition-colors"
          >
            <Minus size={14} />
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className="p-1.5 hover:bg-black/5 rounded transition-colors"
          >
            {win.isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </motion.div>
  );
};
