'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, RotateCcw, RotateCw } from 'lucide-react';

interface VideoPlayerProps {
  src: string; // HLS .m3u8 endpoint
  onProgress: (percent: number) => void;
}

export default function VideoPlayer({ src, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setIsPlaying(false);

    let hls: Hls | null = null;
    const isHls = src.includes('.m3u8');

    const handleMetadata = () => {
      setLoading(false);
    };
    
    const handleCanPlay = () => {
      setLoading(false);
    };

    const handleError = (e: any) => {
      console.error('HTML5 native video tag error:', e);
      setLoading(false);
    };

    const handlePlayEvent = () => {
      setIsPlaying(true);
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
    };

    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 45, // Keep up to 45 seconds of video buffered for smooth playback
        maxMaxBufferLength: 90, // Cap maximum buffering at 90 seconds
        enableWorker: true, // Offload TS demuxing to a web worker to keep UI interaction smooth
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(err => console.log('Autoplay HLS blocked', err));
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error encountered', data);
          setLoading(false);
        }
      });
    } else {
      // Native MP4 / other formats fallback
      video.src = src;
      video.addEventListener('loadedmetadata', handleMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.load(); // Crucial to load the new media resource!
      video.play().catch(err => console.log('Autoplay native blocked', err));
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
    };
  }, [src]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, isPlaying, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Autoplay blocked', err));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = Math.min(video.currentTime + 5, duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = Math.max(video.currentTime - 5, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    
    // Fire progress update callback
    if (video.duration > 0) {
      const percent = Math.floor((video.currentTime / video.duration) * 100);
      // Auto-complete to 100% if within 98% watched or within last 3 seconds of the video
      const finalPercent = (percent >= 98 || video.currentTime >= video.duration - 3) ? 100 : percent;
      onProgress(finalPercent);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(err => console.log('Fullscreen failed', err));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden select-none"
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        onDoubleClick={handleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full cursor-pointer object-contain"
        playsInline
        preload="auto"
        controlsList="nodownload"
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
        </div>
      )}

      {/* Styled custom control bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        
        {/* Playback Seek slider */}
        <div 
          ref={progressBarRef}
          onClick={handleSeek}
          className="w-full h-[5px] hover:h-[7px] bg-white/20 rounded-full mb-3 relative cursor-pointer transition-all flex items-center"
        >
          <div 
            className="h-full bg-brand-purple rounded-full relative" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            {/* Seek thumb marker */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-purple border border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="hover:text-brand-purple transition-colors bg-transparent border-none cursor-pointer" title="Play/Pause">
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* 5s Rewind */}
            <button onClick={skipBackward} className="hover:text-brand-purple transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1" title="Rewind 5s">
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] font-bold">5s</span>
            </button>

            {/* 5s Forward */}
            <button onClick={skipForward} className="hover:text-brand-purple transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1" title="Forward 5s">
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px] font-bold">5s</span>
            </button>

            {/* Mute/Unmute */}
            <button onClick={toggleMute} className="hover:text-brand-purple transition-colors bg-transparent border-none cursor-pointer" title="Mute/Unmute">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Time stamp counter */}
            <span className="text-xs font-semibold select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-white">
            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="hover:text-brand-purple transition-colors bg-transparent border-none cursor-pointer" title="Fullscreen">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
