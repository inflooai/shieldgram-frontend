import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Ban, AlertTriangle, Zap } from 'lucide-react';

interface MockComment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  status: 'approved' | 'hidden';
  risk?: string;
  time: string;
}

const mockComments: MockComment[] = [
  { id: 1, user: 'sarah_styles', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', text: 'Love this outfit! Where did you get it? 😍', status: 'approved', time: '2m' },
  { id: 2, user: 'crypto_king_99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto', text: 'DM me for 100x gains on Bitcoin! 🚀💰', status: 'hidden', risk: 'SPAM', time: '5m' },
  { id: 3, user: 'hater_123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hater', text: 'This looks terrible, delete your account.', status: 'hidden', risk: 'TOXIC', time: '12m' },
  { id: 4, user: 'mike_travels', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', text: 'Great photo, the lighting is perfect.', status: 'approved', time: '15m' },
  { id: 5, user: 'bot_army', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bot', text: 'Click link in bio for free prize 🎁', status: 'hidden', risk: 'SPAM', time: '18m' },
  { id: 6, user: 'jess_m', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jess', text: 'So inspiring! ✨', status: 'approved', time: '21m' },
  { id: 7, user: 'anon_user', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anon', text: 'You are trash.', status: 'hidden', risk: 'HATE', time: '25m' },
];

const CARD_HEIGHT = 100; // Height in px
const GAP = 16; 

const CommentSlideshow: React.FC = () => {
  const [headIndex, setHeadIndex] = useState(0);
  const [processingState, setProcessingState] = useState<'idle' | 'scanning' | 'result' | 'blurring' | 'scrolling'>('idle');

  // Display enough items to fill the container and handle scrolling
  const visibleCount = 5;
  const visibleComments = Array.from({ length: visibleCount + 1 }).map((_, i) => {
    const index = (headIndex + i) % mockComments.length;
    return mockComments[index];
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (processingState) {
      case 'idle':
        timer = setTimeout(() => {
          setProcessingState('scanning');
        }, 500);
        break;

      case 'scanning':
        timer = setTimeout(() => {
          setProcessingState('result');
        }, 1500);
        break;

      case 'result':
        const currentComment = mockComments[(headIndex + 2) % mockComments.length];
        // Keep result longer if it's hidden to show the "blocked" effect
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
        }, 600);
        break;

      case 'scrolling':
        timer = setTimeout(() => {
          setHeadIndex((prev) => (prev + 1) % mockComments.length);
          setProcessingState('idle');
        }, 700); 
        break;
    }

    return () => clearTimeout(timer);
  }, [processingState, headIndex]);

  const isScrolling = processingState === 'scrolling';

  return (
    <div className="w-full max-w-sm mx-auto relative h-[500px] overflow-hidden">
        {/* Mask Gradient for fading top/bottom */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-slate-50 via-transparent to-slate-50 dark:from-slate-950 dark:via-transparent dark:to-slate-950 h-full w-full [mask-image:linear-gradient(to_bottom,black_0%,transparent_15%,transparent_85%,black_100%)]"></div>
        
        {/* Helper gradient overlays for smoother edge fade since mask-image support varies */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-950 z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950 z-20 pointer-events-none"></div>

      <div 
        className={`flex flex-col gap-4 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${isScrolling ? 'transition-transform duration-700' : 'transition-none'}`}
        style={{ 
          transform: isScrolling ? `translateY(-${CARD_HEIGHT + GAP}px)` : 'translateY(0px)',
          paddingTop: '100px' // Initial offset to center the "middle" card
        }}
      >
        {visibleComments.map((comment, index) => {
          // Identify the "Active" card. 
          // Visual Index 2 is the center one usually (0, 1, [2], 3, 4).
          // When scrolling, index 3 becomes the new center.
          const isMiddle = processingState === 'scrolling' ? index === 3 : index === 2;
          
          const isApproved = comment.status === 'approved';
          
          let cardStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
          let scale = "scale-95 opacity-50 blur-[1px]";
          let shadow = "shadow-sm";

          if (isMiddle) {
             scale = "scale-100 opacity-100 blur-0 z-10";
             shadow = "shadow-xl";

             if (processingState === 'scanning') {
                cardStyle = "bg-white dark:bg-slate-900 border-brand-400 dark:border-brand-500 ring-2 ring-brand-100 dark:ring-brand-900/50";
                shadow = "shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]";
             } else if (processingState === 'result' || processingState === 'blurring') {
                if (isApproved) {
                  cardStyle = "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-500/50";
                  shadow = "shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]";
                } else {
                  cardStyle = "bg-rose-50/50 dark:bg-rose-900/10 border-rose-400 dark:border-rose-500/50";
                  shadow = "shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)]";
                }
             }
          }

          // Blurring effect for hidden comments
          const isContentBlurred = isMiddle && !isApproved && processingState === 'blurring';

          return (
            <div 
              key={`${comment.id}-${headIndex}-${index}`}
              className={`
                relative flex-shrink-0 p-4 rounded-2xl border transition-all duration-500 ease-out
                ${cardStyle} ${scale} ${shadow}
              `}
              style={{ height: `${CARD_HEIGHT}px` }}
            >
              <div className="flex items-start gap-4 h-full">
                <div className="relative">
                    <img src={comment.avatar} alt={comment.user} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-100 dark:border-slate-700" />
                    
                    {/* Status Badge Over Avatar */}
                    {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                        <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white dark:border-slate-900 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'} text-white animate-scale-in`}>
                            {isApproved ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-1">
                  <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{comment.user}</p>
                        <span className="text-[10px] text-slate-400">{comment.time}</span>
                     </div>
                     
                     {/* Scanning Indicator */}
                     {isMiddle && processingState === 'scanning' && (
                       <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 animate-pulse">
                         <Zap className="w-3 h-3 fill-brand-600 dark:fill-brand-400" /> AI Scanning
                       </span>
                     )}

                     {/* Result Text */}
                     {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                         <span className={`text-[10px] uppercase font-bold ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                             {isApproved ? 'Approved' : `${comment.risk} DETECTED`}
                         </span>
                     )}
                  </div>
                  
                  <div className="relative">
                      <p 
                        className={`text-sm text-slate-600 dark:text-slate-300 leading-snug transition-all duration-700 ${
                           isContentBlurred ? 'blur-md opacity-40 grayscale' : ''
                        }`}
                      >
                        {comment.text}
                      </p>
                      
                      {/* Hidden Overlay */}
                      {isContentBlurred && (
                          <div className="absolute inset-0 flex items-center justify-start text-rose-600 dark:text-rose-400 font-medium text-xs gap-2 animate-fade-in">
                              <Ban className="w-4 h-4" /> Content Hidden
                          </div>
                      )}
                  </div>
                </div>
              </div>
              
              {/* Scanning Laser Effect */}
              {isMiddle && processingState === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute top-0 left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan -translate-y-1/2"></div>
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
