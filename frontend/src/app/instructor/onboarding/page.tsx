'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { Loader2, Award, BookOpen, DollarSign } from 'lucide-react';

export default function OnboardingPage() {
  const { user, checkSession } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBecomeInstructor() {
    setLoading(true);
    setError(null);
    try {
      await api.post('/users/me/become-instructor');
      await checkSession(); // refreshes Zustand user.role to INSTRUCTOR
      router.replace('/instructor/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-3xl w-full text-center space-y-6 sm:space-y-8 bg-white border border-brand-grey rounded-[4px] shadow-lg p-6 sm:p-12 transition-all">
        <div className="space-y-3 sm:space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
            <GraduationCapIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-brand-charcoal tracking-tight">
            Share your knowledge with the world
          </h1>
          <p className="text-sm sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Join thousands of educators on Coursify. Create premium courses, build your professional brand,
            and earn monthly revenue — all from a single dashboard.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:grid-cols-3 sm:gap-6 text-left mt-6 sm:mt-8">
          {[
            {
              icon: <BookOpen className="w-5 h-5 text-brand-purple" />,
              title: 'Teach your way',
              desc: 'Publish interactive coding exercises, dynamic video playlists, or full bootcamps at your own pace.'
            },
            {
              icon: <Award className="w-5 h-5 text-brand-purple" />,
              title: 'Grow your audience',
              desc: 'Access to dynamic student pools and receive ratings and professional reviews for your content.'
            },
            {
              icon: <DollarSign className="w-5 h-5 text-brand-purple" />,
              title: 'Earn dynamic revenue',
              desc: 'Receive direct payments for every enrollment, coupon sale, or subscription view.'
            }
          ].map((b) => (
            <div key={b.title} className="bg-[#F7F9FA] border border-brand-grey rounded-[4px] p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                {b.icon}
              </div>
              <h3 className="font-bold text-brand-charcoal text-sm">{b.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs py-3 px-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-brand-grey flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto px-6 h-[44px] sm:h-[48px] border border-brand-charcoal text-brand-charcoal text-sm font-bold rounded-[4px] hover:bg-brand-bg transition-colors cursor-pointer bg-white"
          >
            Not now
          </button>
          
          <button
            onClick={handleBecomeInstructor}
            disabled={loading}
            data-testid="onboarding-become-instructor-btn"
            className="w-full sm:w-auto bg-brand-purple hover:bg-brand-purple-hover text-white font-bold px-8 h-[44px] sm:h-[48px] rounded-[4px] text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Become an Instructor'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

// Simple internal icon helper to ensure Lucide references are always valid
function GraduationCapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
