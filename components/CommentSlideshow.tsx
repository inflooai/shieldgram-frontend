import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Ban } from 'lucide-react';

interface MockComment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  status: 'approved' | 'hidden';
  risk?: string;
}

const mockComments: MockComment[] = [
  { id: 1, user: 'sarah_styles', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', text: 'Love this outfit! Where did you get it? 😍', status: 'approved' },
  { id: 2, user: 'crypto_king_99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto', text: 'DM me for 100x gains on Bitcoin! 🚀💰', status: 'hidden', risk: 'SPAM' },
  { id: 3, user: 'hater_123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hater', text: 'This looks terrible, delete your account.', status: 'hidden', risk: 'TOXIC' },
  { id: 4, user: 'mike_travels', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', text: 'Great photo, the lighting is perfect.', status: 'approved' },
  { id: 5, user: 'bot_army', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bot', text: 'Click link in bio for free prize 🎁', status: 'hidden', risk: 'SPAM' },
  { id: 6, user: 'jess_m', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jess', text: 'So inspiring! ✨', status: 'approved' },
  { id: 7, user: 'anon_user', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anon', text: 'You are trash.', status: 'hidden', risk: 'HATE' },
];

const CARD_HEIGHT = 88; // Height in px
const GAP = 16; // Gap in px

const CommentSlideshow: React.FC = () => {
  const [headIndex, setHeadIndex] = useState(0);
  const [processingState, setProcessingState] = useState<'idle' | 'scanning' | 'result' | 'blurring' | 'scrolling'>('idle');

  // Derive the visible window of comments (Top 3 + 1 incoming)
  const visibleComments = Array.from({ length: 4 }).map((_, i) => {
    const index = (headIndex + i) % mockComments.length;
    return mockComments[index];
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (processingState) {
      case 'idle':
        // Start processing the new middle card (index 1) after a short delay
        timer = setTimeout(() => {
          setProcessingState('scanning');
        }, 500);
        break;

      case 'scanning':
        // Simulate scanning duration
        timer = setTimeout(() => {
          setProcessingState('result');
        }, 1200);
        break;

      case 'result':
        // Show result for a while
        // The middle card is at index 1 relative to headIndex
        const currentComment = mockComments[(headIndex + 1) % mockComments.length];
        const isHidden = currentComment.status === 'hidden';
        const delay = isHidden ? 1500 : 1500;
        
        timer = setTimeout(() => {
          if (isHidden) {
            setProcessingState('blurring');
          } else {
            setProcessingState('scrolling');
          }
        }, delay);
        break;

      case 'blurring':
        // Show blur effect briefly before scrolling
        timer = setTimeout(() => {
          setProcessingState('scrolling');
        }, 800);
        break;

      case 'scrolling':
        // Wait for CSS transition to finish, then reset
        timer = setTimeout(() => {
          setHeadIndex((prev) => (prev + 1) % mockComments.length);
          setProcessingState('idle');
        }, 600); // Matches CSS duration
        break;
    }

    return () => clearTimeout(timer);
  }, [processingState, headIndex]);

  const isScrolling = processingState === 'scrolling';

  return (
    <div className="w-full max-w-md mx-auto relative h-[320px] overflow-hidden p-1 mask-gradient-v">
      <div 
        className={`flex flex-col gap-4 ease-in-out will-change-transform ${isScrolling ? 'transition-transform duration-600' : 'transition-none duration-0'}`}
        style={{ 
          transform: isScrolling ? `translateY(-${CARD_HEIGHT + GAP}px)` : 'translateY(0px)' 
        }}
      >
        {visibleComments.map((comment, index) => {
          // KEY FIX: During scroll, the visual middle shifts to Index 2 (the one moving UP into the slot).
          // Otherwise, the focus lags on Index 1 which is moving OUT.
          const isMiddle = processingState === 'scrolling' ? index === 2 : index === 1;
          const isApproved = comment.status === 'approved';
          
          let borderClass = 'border-slate-200 dark:border-slate-800';
          let bgClass = 'bg-white dark:bg-slate-900';
          let opacityClass = 'opacity-100';
          let blurClass = 'blur-0';

          // Apply focus/blur logic CONSTANTLY, even during 'idle', to prevent flickering.
          if (isMiddle) {
             // Active Card Logic
             // FIX: Removed 'scrolling' from the condition below. 
             // The incoming middle card (index 2 during scroll) should NOT show green/red yet.
             if (processingState === 'result' || processingState === 'blurring') {
                if (isApproved) {
                  borderClass = 'border-green-200 dark:border-green-800';
                  bgClass = 'bg-green-50 dark:bg-green-900/20';
                } else {
                  borderClass = 'border-red-200 dark:border-red-800';
                  bgClass = 'bg-red-50 dark:bg-red-900/20';
                }
             }
             if (processingState === 'scanning') {
                borderClass = 'border-brand-200 dark:border-brand-800';
                bgClass = 'bg-brand-50/30 dark:bg-brand-900/10 shadow-[0_0_15px_rgba(56,189,248,0.3)]';
             }
          } else {
             // Non-active cards get blurred to focus attention on the middle
             // Index 3 (incoming) and Index 0 (outgoing) are not the focus
             if (index !== 3) { 
               blurClass = 'blur-[2px] opacity-40 grayscale';
             }
          }

          // Text blur only happens during the 'blurring' phase for the active card
          // We remove 'scrolling' here so the NEW middle card entering doesn't start with blurred text
          const isTextBlurred = isMiddle && processingState === 'blurring';

          // Incoming card (Index 3) starts invisible until it scrolls in
          if (index === 3) {
             opacityClass = isScrolling ? 'opacity-40 blur-[2px] grayscale' : 'opacity-0';
          }

          return (
            <div 
              key={`${comment.id}-${headIndex}-${index}`}
              className={`
                relative flex-shrink-0 p-4 rounded-xl border shadow-sm transition-all duration-300
                ${borderClass} ${bgClass} ${opacityClass} ${blurClass}
              `}
              style={{ height: `${CARD_HEIGHT}px` }}
            >
              <div className="flex items-start gap-3">
                <img src={comment.avatar} alt={comment.user} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                     <p className="text-sm font-bold text-slate-900 dark:text-white">{comment.user}</p>
                     
                     {/* Status Badge - Only show when NOT scrolling to avoid spoilers on the incoming card */}
                     {isMiddle && (processingState === 'result' || processingState === 'blurring') && (
                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-scale-in ${
                            isApproved 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                            {isApproved ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            {isApproved ? 'Approved' : comment.risk || 'Hidden'}
                        </span>
                     )}
                     
                     {isMiddle && processingState === 'scanning' && (
                       <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 animate-pulse">
                         <Shield className="w-3 h-3" /> Scanning
                       </span>
                     )}
                  </div>
                  
                  <p 
                    className={`text-sm text-slate-600 dark:text-slate-300 mt-1 truncate transition-all duration-700 ${
                       isTextBlurred ? 'blur-sm opacity-50 select-none' : ''
                    }`}
                  >
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Top and Bottom Gradients for smooth fade feel */}
      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-10"></div>
    </div>
  );
};

export default CommentSlideshow;