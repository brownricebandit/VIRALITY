import React, { useCallback, useState } from 'react';
import { UploadCloud, FileVideo, AlertCircle, Layers } from 'lucide-react';
import { VideoFile } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UploadZoneProps {
  onFilesSelected: (files: VideoFile[]) => void;
  isDisabled: boolean;
  currentCount: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isDisabled, currentCount }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) setIsDragging(true);
  }, [isDisabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = (fileList: FileList | File[]) => {
    setError(null);
    const files = Array.from(fileList);
    
    const validFiles: VideoFile[] = [];
    let errorMsg = "";

    if (currentCount + files.length > 10) {
      setError("Maximum 10 videos allowed.");
      return;
    }

    files.forEach(file => {
        if (!file.type.startsWith('video/')) {
            errorMsg = "Some files were skipped (not video).";
            return;
        }
        // 15MB Limit for demo
        if (file.size > 15 * 1024 * 1024) {
            errorMsg = "Some files skipped (too large > 15MB).";
            return;
        }

        validFiles.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'queued'
        });
    });

    if (errorMsg) setError(errorMsg);
    if (validFiles.length > 0) {
        onFilesSelected(validFiles);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDisabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [isDisabled, processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center p-8
          ${isDisabled ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900/20' : 
            isDragging 
              ? 'border-brand-500 bg-brand-500/10 scale-[1.01]' 
              : 'border-slate-700 bg-slate-800/30 hover:border-brand-500/50 hover:bg-slate-800/50'
          }
        `}
      >
        <input
          type="file"
          accept="video/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileInput}
          disabled={isDisabled}
        />
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-400 group-hover:text-brand-400 group-hover:bg-slate-700'}`}>
            {isDragging ? <Layers className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-base font-semibold text-white mb-1">
              {isDragging ? "Drop videos here" : "Upload videos"}
            </p>
            <p className="text-xs text-slate-400">
              Drag & drop up to 10 videos<br />
              <span className="text-[10px] text-slate-500">(Max 15MB each)</span>
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};