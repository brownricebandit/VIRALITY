import React from 'react';
import { AnalysisResult, LoadingState } from '../types';
import { Copy, Check, Hash, FileText, Users, Activity } from 'lucide-react';

interface AnalysisViewProps {
  loadingState: LoadingState;
  result: AnalysisResult | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ loadingState, result }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{ show: boolean, platform: string } | null>(null);

  React.useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const copyToClipboard = (text: string, index: number, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setToast({ show: true, platform });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loadingState === LoadingState.ANALYZING || loadingState === LoadingState.READING) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in duration-500">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-brand-500 border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-brand-500 animate-pulse" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            {loadingState === LoadingState.READING ? "Processing video file..." : "Analyzing with Gemini AI..."}
          </h3>
          <p className="text-slate-400 mt-2 max-w-md">
            Extracting transcript, identifying visual cues, and generating optimized captions. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (loadingState === LoadingState.ERROR) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-red-400">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
           <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">Analysis Failed</h3>
        <p className="mt-2">Something went wrong while processing your video. Please try again.</p>
      </div>
    );
  }

  if (!result) return null;

  // Sort captions so Facebook/YouTube comes first
  const sortedCaptions = [...result.captions].sort((a, b) => {
    const isFbA = a.platform.toLowerCase().includes('facebook') || a.platform.toLowerCase().includes('youtube');
    const isFbB = b.platform.toLowerCase().includes('facebook') || b.platform.toLowerCase().includes('youtube');
    if (isFbA && !isFbB) return -1;
    if (!isFbA && isFbB) return 1;
    return 0;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 relative">
      
      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-brand-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold text-white">Transcript Summary</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
                {result.transcriptSummary}
            </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold text-white">Target Audience</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
                {result.audienceAnalysis}
            </p>
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 text-indigo-400">
            <Hash className="w-5 h-5" />
            <h3 className="font-semibold text-white">SEO Keywords Detected</h3>
        </div>
        <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
                <span key={i} className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
                    #{kw}
                </span>
            ))}
        </div>
      </div>

      {/* Captions Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white px-1">Optimized Captions</h3>
        <div className="grid grid-cols-1 gap-6">
            {sortedCaptions.map((cap, idx) => (
                <div key={idx} className="group bg-slate-900/50 border border-slate-800 hover:border-brand-500/30 rounded-xl p-6 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                            onClick={() => {
                                const textToCopy = cap.title 
                                    ? `${cap.title}\n\n${cap.caption}\n\n${cap.hashtags.map(h => `${h}`).join(' ')}`
                                    : `${cap.caption}\n\n${cap.hashtags.map(h => `${h}`).join(' ')}`;
                                copyToClipboard(textToCopy, idx, cap.platform);
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shadow-lg border border-slate-700 transition-colors"
                            title="Copy Caption"
                        >
                            {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <span className={`
                            px-3 py-1 rounded-full text-xs font-medium border 
                            ${cap.platform.toLowerCase().includes('tiktok') ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 
                              cap.platform.toLowerCase().includes('instagram') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                        `}>
                            {cap.platform}
                        </span>
                        <span className="text-xs text-slate-500 font-mono mr-12">{cap.strategy}</span>
                    </div>

                    {cap.title && (
                        <div className="mb-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">SEO Title</span>
                            <h4 className="text-lg font-bold text-white leading-tight">{cap.title}</h4>
                        </div>
                    )}

                    <p className="text-slate-200 whitespace-pre-line mb-4 text-sm leading-relaxed border-l-2 border-slate-700 pl-4">
                        {cap.caption}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800/50">
                        {cap.hashtags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-brand-400 text-xs hover:underline cursor-pointer">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-brand-500/50 text-white px-4 py-3 rounded-lg shadow-2xl shadow-brand-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
            <div className="bg-emerald-500/20 p-1 rounded-full">
                <Check className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
                <p className="text-sm font-medium">Copied to clipboard!</p>
                <p className="text-xs text-slate-400">{toast.platform} caption ready.</p>
            </div>
        </div>
      )}
    </div>
  );
};