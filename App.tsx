import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { AnalysisView } from './components/AnalysisView';
import { VideoList } from './components/VideoList';
import { VideoFile, LoadingState } from './types';
import { analyzeVideo } from './services/geminiService';
import { generatePDF } from './services/pdfService';
import { generateDOCX } from './services/docxService';
import { Settings2, FileText, Download, Play, Pause, FileType } from 'lucide-react';

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedVideo = videos.find(v => v.id === selectedVideoId) || null;

  // Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessing) return;

      const nextVideoIndex = videos.findIndex(v => v.status === 'queued');
      if (nextVideoIndex === -1) return;

      setIsProcessing(true);
      const videoToProcess = videos[nextVideoIndex];

      // Update status to analyzing
      setVideos(prev => prev.map((v, i) => i === nextVideoIndex ? { ...v, status: 'analyzing' } : v));

      try {
        // Convert to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(videoToProcess.file);
        });

        // Analyze
        const analysis = await analyzeVideo(base64, videoToProcess.file.type, maxLength);

        // Update status to complete
        setVideos(prev => prev.map(v => v.id === videoToProcess.id ? { 
          ...v, 
          status: 'complete', 
          analysis: analysis 
        } : v));

      } catch (error) {
        console.error(error);
        setVideos(prev => prev.map(v => v.id === videoToProcess.id ? { 
          ...v, 
          status: 'error', 
          error: 'Analysis failed' 
        } : v));
      } finally {
        setIsProcessing(false);
      }
    };

    processQueue();
  }, [videos, isProcessing, maxLength]);

  const handleFilesSelected = (newFiles: VideoFile[]) => {
    setVideos(prev => {
        const updated = [...prev, ...newFiles];
        // Select first uploaded if none selected
        if (!selectedVideoId && newFiles.length > 0) {
            setSelectedVideoId(newFiles[0].id);
        }
        return updated;
    });
  };

  const removeVideo = (id: string) => {
    setVideos(prev => {
        const updated = prev.filter(v => v.id !== id);
        if (selectedVideoId === id) {
            setSelectedVideoId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
    });
  };

  const handleExportPDF = () => {
    generatePDF(videos);
  };

  const handleExportDOCX = () => {
    generateDOCX(videos);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
        videoRef.current.pause();
    } else {
        videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnded = () => setIsPlaying(false);
    vid.addEventListener('ended', onEnded);
    return () => vid.removeEventListener('ended', onEnded);
  }, [selectedVideo]);

  // Helper to map VideoFile status to LoadingState for the AnalysisView component
  const getLoadingStateForView = (video: VideoFile | null): LoadingState => {
    if (!video) return LoadingState.IDLE;
    switch (video.status) {
        case 'queued': return LoadingState.IDLE;
        case 'analyzing': return LoadingState.ANALYZING;
        case 'complete': return LoadingState.COMPLETE;
        case 'error': return LoadingState.ERROR;
        default: return LoadingState.IDLE;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative">
        
        {/* Left Panel: Upload & List - Sticky on Desktop */}
        <div className="md:col-span-4 space-y-6 h-fit md:sticky md:top-24">
          
          {/* Settings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 text-slate-300">
                <Settings2 className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium">Caption Preferences</span>
            </div>
            <div className="flex items-center justify-between gap-3">
                <select 
                value={maxLength || ''}
                onChange={(e) => setMaxLength(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-all cursor-pointer hover:border-slate-600"
                >
                <option value="">Auto Length (AI Optimized)</option>
                <option value="100">Short (~100 chars)</option>
                <option value="280">Medium (~280 chars)</option>
                <option value="500">Long (~500 chars)</option>
                </select>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden p-4">
             <h2 className="font-semibold text-white mb-4 px-2">Upload Queue</h2>
             <UploadZone 
                onFilesSelected={handleFilesSelected} 
                isDisabled={false} 
                currentCount={videos.length}
            />
            
            <div className="mt-6">
                <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Videos ({videos.length}/10)</span>
                    {videos.some(v => v.status === 'complete') && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleExportPDF}
                                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors font-medium hover:bg-slate-800 px-2 py-1 rounded"
                                title="Export as PDF"
                            >
                                <Download className="w-3 h-3" /> PDF
                            </button>
                            <div className="w-px h-3 bg-slate-700"></div>
                            <button 
                                onClick={handleExportDOCX}
                                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors font-medium hover:bg-slate-800 px-2 py-1 rounded"
                                title="Export as DOCX"
                            >
                                <FileType className="w-3 h-3" /> DOCX
                            </button>
                        </div>
                    )}
                </div>
                <VideoList 
                    videos={videos}
                    selectedId={selectedVideoId}
                    onSelect={setSelectedVideoId}
                    onRemove={removeVideo}
                />
            </div>
          </div>
        </div>

        {/* Right Panel: Preview & Results */}
        <div className="md:col-span-8">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl min-h-[800px] flex flex-col">
            
            {/* Selected Video Preview Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-6">
                {selectedVideo ? (
                    <div className="w-full max-w-2xl mx-auto relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 group shadow-2xl">
                        <video 
                            ref={videoRef}
                            src={selectedVideo.previewUrl} 
                            className="w-full h-full object-contain"
                            key={selectedVideo.previewUrl} // Force reload on switch
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                           <div className="pointer-events-auto">
                                <button 
                                    onClick={togglePlay}
                                    className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 text-white fill-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
                                </button>
                           </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-600">
                        <FileText className="w-12 h-12 mb-2 opacity-50" />
                        <p>Select a video to view analysis</p>
                    </div>
                )}
            </div>

            {/* Analysis Results */}
            <div className="flex-1 p-6 bg-slate-900/30">
                {selectedVideo ? (
                     <div className="max-w-3xl mx-auto">
                        <AnalysisView 
                            loadingState={getLoadingStateForView(selectedVideo)} 
                            result={selectedVideo.analysis || null} 
                        />
                     </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 mt-12">
                        <p>Upload videos to generate viral captions</p>
                    </div>
                )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;