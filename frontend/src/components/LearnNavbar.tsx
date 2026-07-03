'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, FileDown } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface LearnNavbarProps {
  courseId: number;
  courseTitle: string;
  progressPercent: number;
}

export default function LearnNavbar({ courseId, courseTitle, progressPercent }: LearnNavbarProps) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [hasUnlockedCertificate, setHasUnlockedCertificate] = useState(false);

  useEffect(() => {
    let active = true;
    const checkUnlock = async () => {
      if (user && courseId) {
        try {
          const res = await api.get(`/certificates/unlocked/${courseId}`);
          if (active) {
            setHasUnlockedCertificate(res.data.unlocked);
          }
        } catch (e) {
          const key = `completed_course_${user.id}_${courseId}`;
          if (progressPercent === 100) {
            localStorage.setItem(key, 'true');
            if (active) setHasUnlockedCertificate(true);
          } else {
            const isCompleted = localStorage.getItem(key) === 'true';
            if (active) setHasUnlockedCertificate(isCompleted);
          }
        }
      }
    };
    checkUnlock();
    return () => {
      active = false;
    };
  }, [progressPercent, user, courseId]);

  const claimCertificate = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/certificates/download/${courseId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to claim certificate', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="h-[56px] bg-brand-charcoal border-b border-brand-charcoal-hover flex items-center justify-between px-4 text-white z-50">
      
      {/* 1. Back Arrow and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/my-courses" className="w-[44px] h-[44px] hover:bg-brand-charcoal-hover rounded-full transition-colors flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="h-6 w-[1px] bg-brand-charcoal-hover shrink-0" />
        <h1 className="text-sm font-semibold truncate max-w-[300px] select-none">
          {courseTitle}
        </h1>
      </div>

      {/* 2. Progress Indicator and Certificate Button */}
      <div className="flex items-center gap-4 shrink-0">
        {(progressPercent === 100 || hasUnlockedCertificate) && (
          <button
            onClick={claimCertificate}
            disabled={downloading}
            className="flex items-center gap-1.5 h-[34px] px-3.5 bg-brand-purple hover:bg-brand-purple-hover text-white text-[11px] font-extrabold rounded-[4px] border-none transition-colors cursor-pointer disabled:opacity-50 shrink-0 select-none animate-pulse"
          >
            <FileDown className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Claim Certificate'}
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Progress Ring / Progress Stats */}
          <Award className="w-5 h-5 text-brand-gold animate-bounce" />
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Your Progress</p>
            <p className="text-xs font-bold text-white">{progressPercent}% Completed</p>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-[120px] h-[6px] bg-brand-charcoal-hover rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
}
