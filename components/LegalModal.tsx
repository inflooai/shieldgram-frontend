import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface LegalModalProps {
  title: string;
  contentPath: string;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ title, contentPath, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(contentPath);
        if (!response.ok) throw new Error('Failed to load document');
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError('Could not load the requested document. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentPath]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading document...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 font-medium">{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                {content}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all font-semibold shadow-md shadow-brand-500/10"
          >
            I Understand
          </button>
        </div>
      </div>
      
      {/* Background overlay to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default LegalModal;
