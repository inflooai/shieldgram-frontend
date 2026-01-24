import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Ban, AlertTriangle, Zap, Sparkles } from 'lucide-react';

interface MockComment {
  id: number;
  user: string;
  text: string;
  status: 'approved' | 'hidden';
  risk?: string;
  time: string;
  color: string; // For avatar background
}

const initialComments: MockComment[] = [
  { id: 1, user: 'sarah_styles', text: 'Love this outfit! Where did you get it? 😍', status: 'approved', time: '2m', color: 'bg-gradient-to-tr from-pink-400 to-rose-500' },
  { id: 2, user: 'crypto_king_99', text: 'DM me for 100x gains on Bitcoin! 🚀💰', status: 'hidden', risk: 'SPAM', time: '5m', color: 'bg-gradient-to-tr from-yellow-400 to-orange-500' },
  { id: 3, user: 'hater_123', text: 'This looks terrible, delete your account.', status: 'hidden', risk: 'TOXIC', time: '12m', color: 'bg-gradient-to-tr from-red-500 to-rose-600' },
  { id: 4, user: 'mike_travels', text: 'Great photo, the lighting is perfect.', status: 'approved', time: '15m', color: 'bg-gradient-to-tr from-blue-400 to-indigo-500' },
  { id: 5, user: 'bot_army', text: 'Click link in bio for free prize 🎁', status: 'hidden', risk: 'SPAM', time: '18m', color: 'bg-gradient-to-tr from-purple-400 to-violet-500' },
  { id: 6, user: 'jess_m', text: 'So inspiring! ✨', status: 'approved', time: '21m', color: 'bg-gradient-to-tr from-teal-400 to-emerald-500' },
  { id: 7, user: 'anon_user', text: 'You are trash.', status: 'hidden', risk: 'HATE', time: '25m', color: 'bg-gradient-to-tr from-orange-400 to-red-500' },
  { id: 8, user: 'amy_fitness', text: 'Amazing transformation! Keep going! 💪', status: 'approved', time: '30m', color: 'bg-gradient-to-tr from-green-400 to-emerald-600' },
];

const CARD_HEIGHT = 90; // Height in px
const GAP = 16; 

const CommentSlideshow: React.FC = () => {
  const [mockComments] = useState<MockComment[]>(initialComments);
  const [headIndex, setHeadIndex] = useState(0);
  const [processingState, setProcessingState] = useState<'idle' | 'scanning' | 'result' | 'blurring' | 'scrolling'>('idle');

  // Display 4 comments + 2 for smooth scroll
  const visibleCount = 6;
  const visibleComments = Array.from({ length: visibleCount }).map((_, i) => {
    const index = (headIndex + i) % mockComments.length;
    return mockComments[index];
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (processingState) {
      case 'idle':
        timer = setTimeout(() => {
          setProcessingState('scanning');
        }, 800);
        break;

      case 'scanning':
        timer = setTimeout(() => {
          setProcessingState('result');
        }, 1600);
        break;

      case 'result':
        const currentComment = mockComments[(headIndex + 2) % mockComments.length];
        const delay = 1800; 
        
        timer = setTimeout(() => {
          if (currentComment.status === 'hidden') {
            setProcessingState('blurring');
          } else {
            setProcessingState('scrolling');
          }
        }, delay);
        break;

      case 'blurring':
        timer = setTimeout(() => {
          setProcessingState('scrolling');
        }, 800);
        break;

      case 'scrolling':
        timer = setTimeout(() => {
          setHeadIndex((prev) => (prev + 1) % mockComments.length);
          setProcessingState('idle');
        }, 700); 
        break;
    }

    return () => clearTimeout(timer);
  }, [processingState, headIndex, mockComments]);

  const isScrolling = processingState === 'scrolling';

  // Helper to get user initials
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-md mx-auto relative h-[480px] overflow-hidden" style={{ perspective: '1200px' }}>
        {/* Elegant fade gradients */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 z-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 z-30 pointer-events-none"></div>

      <div 
        className={`flex flex-col gap-4 will-change-transform ${isScrolling ? 'transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''}`}
        style={{ 
          transform: isScrolling ? `translate3d(0, -${CARD_HEIGHT + GAP}px, 0)` : 'translate3d(0, 0, 0)',
          paddingTop: '100px',
          transformStyle: 'preserve-3d'
        }}
      >
        {visibleComments.map((comment, index) => {
          // Adjust index logic for the active "middle" card (index 2 is the focus)
          const isMiddle = processingState === 'scrolling' ? index === 3 : index === 2;
          const isApproved = comment.status === 'approved';
          
          let cardStyle = "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/20 dark:border-white/5";
          let transformClass = "scale-90 opacity-40 translate-z-[-50px] rotate-x-[10deg]"; 
          let shadow = "shadow-lg shadow-black/5";
          let borderClass = "border";

          if (isMiddle) {
             transformClass = "scale-100 opacity-100 translate-z-0 rotate-x-0 z-20";
             shadow = "shadow-2xl shadow-slate-900/20 dark:shadow-black/50";
             
             // Base active style
             cardStyle = "bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl";

             if (processingState === 'scanning') {
                borderClass = "border-2 border-brand-400 dark:border-brand-500";
                shadow = "shadow-[0_0_40px_-10px_rgba(56,189,248,0.5)]";
             } else if (processingState === 'result' || processingState === 'blurring') {
                if (isApproved) {
                  cardStyle = "bg-emerald-50/95 dark:bg-emerald-950/80 backdrop-blur-xl";
                  borderClass = "border-2 border-emerald-400/50 dark:border-emerald-500/50";
                  shadow = "shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]";
                } else {
                  cardStyle = "bg-rose-50/95 dark:bg-rose-950/80 backdrop-blur-xl";
                  borderClass = "border-2 border-rose-400/50 dark:border-rose-500/50";
                  shadow = "shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]";
                }
             }
          }

          const isContentBlurred = isMiddle && !isApproved && processingState === 'blurring';

          return (
            <div 
              key={`${comment.id}-${index}`}
              className={`
                relative flex-shrink-0 px-5 py-4 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] mx-6
                ${cardStyle} ${transformClass} ${shadow} ${borderClass}
              `}
              style={{ 
                height: `${CARD_HEIGHT}px`,
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="flex items-center gap-4 h-full relative z-10">
                <div className="relative flex-shrink-0 group">
                    {/* Gradient Avatar */}
                    <div className={`w-11 h-11 rounded-full ${comment.color} flex items-center justify-center text-white font-bold text-sm border-[3px] border-white dark:border-slate-800 shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                      {getInitials(comment.user)}
                    </div>
                    
                    {/* Status Badge with Pop Effect */}
                    {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                        <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-[3px] border-white dark:border-slate-900 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'} text-white animate-[scale-in_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] shadow-sm`}>
                            {isApproved ? <Check className="w-3 h-3" strokeWidth={4} /> : <X className="w-3 h-3" strokeWidth={4} />}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-center mb-1.5">
                     <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px] tracking-tight">{comment.user}</p>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{comment.time}</span>
                     </div>
                     
                     {/* Scanning Indicator */}
                     {isMiddle && processingState === 'scanning' && (
                       <span className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-brand-600 dark:text-brand-400 animate-pulse bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 rounded-full">
                         <Zap className="w-3 h-3 fill-brand-600 dark:fill-brand-400" /> AI Scan
                       </span>
                     )}

                     {/* Result Label */}
                     {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                         <span className={`flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${isApproved ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                             {isApproved ? (
                               <>
                                <Sparkles className="w-3 h-3" /> Safe
                               </>
                             ) : (
                               <>
                                <Shield className="w-3 h-3" /> {comment.risk}
                               </>
                             )}
                         </span>
                     )}
                  </div>
                  
                  <div className="relative">
                      <p 
                        className={`text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-snug transition-all duration-700 line-clamp-2 ${
                           isContentBlurred ? 'blur-md opacity-20 scale-95' : ''
                        }`}
                      >
                        {comment.text}
                      </p>
                      
                      {/* Hidden Overlay */}
                      {isContentBlurred && (
                          <div className="absolute inset-0 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm gap-2 animate-[scale-in_0.3s_ease-out_forwards]">
                              <Ban className="w-4 h-4" /> Hidden by AI
                          </div>
                      )}
                  </div>
                </div>
              </div>
              
              {/* Futuristic Scan Line Effect */}
              {isMiddle && processingState === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
                    <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-transparent via-brand-400/20 to-transparent animate-scan blur-sm"></div>
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-scan"></div>
                </div>
              )}

              {/* Particle Effects (CSS-based) */}
              {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                 <>
                    {/* Top Left */}
                    <div className={`absolute -top-2 -left-2 w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-400' : 'bg-rose-400'} animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75`}></div>
                    {/* Bottom Right */}
                    <div className={`absolute -bottom-2 -right-2 w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-400' : 'bg-rose-400'} animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500 opacity-75`}></div>
                 </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSlideshow;
