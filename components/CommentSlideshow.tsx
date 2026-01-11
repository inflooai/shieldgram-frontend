import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Ban, AlertTriangle, Zap } from 'lucide-react';

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
  { id: 1, user: 'sarah_styles', text: 'Love this outfit! Where did you get it? 😍', status: 'approved', time: '2m', color: 'bg-pink-500' },
  { id: 2, user: 'crypto_king_99', text: 'DM me for 100x gains on Bitcoin! 🚀💰', status: 'hidden', risk: 'SPAM', time: '5m', color: 'bg-yellow-500' },
  { id: 3, user: 'hater_123', text: 'This looks terrible, delete your account.', status: 'hidden', risk: 'TOXIC', time: '12m', color: 'bg-red-500' },
  { id: 4, user: 'mike_travels', text: 'Great photo, the lighting is perfect.', status: 'approved', time: '15m', color: 'bg-blue-500' },
  { id: 5, user: 'bot_army', text: 'Click link in bio for free prize 🎁', status: 'hidden', risk: 'SPAM', time: '18m', color: 'bg-purple-500' },
  { id: 6, user: 'jess_m', text: 'So inspiring! ✨', status: 'approved', time: '21m', color: 'bg-teal-500' },
  { id: 7, user: 'anon_user', text: 'You are trash.', status: 'hidden', risk: 'HATE', time: '25m', color: 'bg-orange-500' },
  { id: 8, user: 'amy_fitness', text: 'Amazing transformation! Keep going! 💪', status: 'approved', time: '30m', color: 'bg-green-500' },
];

const CARD_HEIGHT = 90; // Height in px
const GAP = 12; 

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
        }, 600);
        break;

      case 'scanning':
        timer = setTimeout(() => {
          setProcessingState('result');
        }, 1400);
        break;

      case 'result':
        const currentComment = mockComments[(headIndex + 2) % mockComments.length];
        const delay = 1600; 
        
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
        }, 500);
        break;

      case 'scrolling':
        timer = setTimeout(() => {
          setHeadIndex((prev) => (prev + 1) % mockComments.length);
          setProcessingState('idle');
        }, 600); 
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
    <div className="w-full max-w-md mx-auto relative h-[440px] overflow-hidden">
        {/* Elegant fade gradients */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-50 via-slate-50/60 to-transparent dark:from-slate-950 dark:via-slate-950/60 z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 via-slate-50/60 to-transparent dark:from-slate-950 dark:via-slate-950/60 z-20 pointer-events-none"></div>

      <div 
        className={`flex flex-col gap-3 will-change-transform ${isScrolling ? 'transition-transform duration-500 ease-out' : ''}`}
        style={{ 
          transform: isScrolling ? `translate3d(0, -${CARD_HEIGHT + GAP}px, 0)` : 'translate3d(0, 0, 0)',
          paddingTop: '80px'
        }}
      >
        {visibleComments.map((comment, index) => {
          const isMiddle = processingState === 'scrolling' ? index === 3 : index === 2;
          const isApproved = comment.status === 'approved';
          
          let cardStyle = "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60";
          let scale = "scale-95 opacity-40";
          let shadow = "shadow-sm";

          if (isMiddle) {
             scale = "scale-100 opacity-100 z-10";
             shadow = "shadow-xl shadow-slate-900/10 dark:shadow-black/40";

             if (processingState === 'scanning') {
                cardStyle = "bg-white dark:bg-slate-900 border-brand-400 dark:border-brand-500 ring-2 ring-brand-200/50 dark:ring-brand-900/30";
                shadow = "shadow-[0_0_24px_-5px_rgba(14,165,233,0.4)]";
             } else if (processingState === 'result' || processingState === 'blurring') {
                if (isApproved) {
                  cardStyle = "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50 backdrop-blur-sm";
                  shadow = "shadow-[0_0_24px_-5px_rgba(16,185,129,0.3)]";
                } else {
                  cardStyle = "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/50 backdrop-blur-sm";
                  shadow = "shadow-[0_0_24px_-5px_rgba(244,63,94,0.3)]";
                }
             }
          }

          const isContentBlurred = isMiddle && !isApproved && processingState === 'blurring';

          return (
            <div 
              key={`${comment.id}-${index}`}
              className={`
                relative flex-shrink-0 px-4 py-3 rounded-xl border transition-all duration-500 ease-out mx-4
                ${cardStyle} ${scale} ${shadow}
              `}
              style={{ height: `${CARD_HEIGHT}px` }}
            >
              <div className="flex items-start gap-3 h-full">
                <div className="relative flex-shrink-0">
                    {/* Simple colored initial avatar */}
                    <div className={`w-10 h-10 rounded-full ${comment.color} flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-slate-800 shadow-sm`}>
                      {getInitials(comment.user)}
                    </div>
                    
                    {/* Status Badge */}
                    {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 border-2 border-white dark:border-slate-900 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'} text-white animate-scale-in`}>
                            {isApproved ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <X className="w-2.5 h-2.5" strokeWidth={3} />}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{comment.user}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{comment.time}</span>
                     </div>
                     
                     {/* Scanning Indicator */}
                     {isMiddle && processingState === 'scanning' && (
                       <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 animate-pulse">
                         <Zap className="w-3 h-3 fill-brand-600 dark:fill-brand-400" /> Scanning
                       </span>
                     )}

                     {/* Result */}
                     {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                         <span className={`text-[10px] uppercase font-bold ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                             {isApproved ? '✓ Safe' : `${comment.risk}`}
                         </span>
                     )}
                  </div>
                  
                  <div className="relative">
                      <p 
                        className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed transition-all duration-700 line-clamp-2 ${
                           isContentBlurred ? 'blur-md opacity-30' : ''
                        }`}
                      >
                        {comment.text}
                      </p>
                      
                      {/* Hidden Overlay */}
                      {isContentBlurred && (
                          <div className="absolute inset-0 flex items-center justify-start text-rose-600 dark:text-rose-400 font-semibold text-xs gap-1.5 animate-fade-in">
                              <Ban className="w-3.5 h-3.5" /> Hidden
                          </div>
                      )}
                  </div>
                </div>
              </div>
              
              {/* Scanning Effect */}
              {isMiddle && processingState === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-brand-400/8 to-transparent animate-scan -translate-y-1/2"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSlideshow;
