import React from 'react';
import { VideoFile } from '../types';
import { Play, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

interface VideoListProps {
  videos: VideoFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, selectedId, onSelect, onRemove }) => {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {videos.map((video) => (
        <div 
          key={video.id}
          onClick={() => onSelect(video.id)}
          className={`
            relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
            ${selectedId === video.id 
              ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-900/20' 
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }
          `}
        >
          {/* Thumbnail */}
          <div className="w-16 h-12 bg-black rounded-md overflow-hidden flex-shrink-0 relative border border-slate-700/50">
            <video src={video.previewUrl} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${selectedId === video.id ? 'text-white' : 'text-slate-300'}`}>
              {video.file.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {video.status === 'queued' && <span className="text-xs text-slate-500 flex items-center gap-1">Pending</span>}
              {video.status === 'analyzing' && <span className="text-xs text-brand-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</span>}
              {video.status === 'complete' && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>}
              {video.status === 'error' && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>}
            </div>
          </div>

          {/* Actions */}
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(video.id); }}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};