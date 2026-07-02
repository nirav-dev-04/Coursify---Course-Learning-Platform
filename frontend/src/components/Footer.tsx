'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handlePlaceholderClick = (name: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setToastMessage(`Feature Coming Soon: The ${name} section is currently under development.`);
    const id = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    setTimeoutId(id);
  };

  // Hide the global Footer on course learning paths to maintain cinema viewport aspect ratio.
  if (pathname.startsWith('/learn')) {
    return null;
  }

  return (
    <footer className="bg-[#1c1d1f] text-[#d1d7dc] pt-12 pb-8 pb-[calc(2rem+env(safe-area-inset-bottom))] px-6 md:px-12 mt-auto border-t border-[#3d3d3d] select-none relative">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-8">
        
        {/* Column 1 */}
        <div className="flex flex-col space-y-2 text-xs">
          <button 
            onClick={() => handlePlaceholderClick('Udemy Business')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Udemy Business
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Teach on Udemy')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Teach on Udemy
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Get the App')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Get the app
          </button>
          <Link href="/about" className="hover:text-white hover:underline transition-colors font-medium">
            About us
          </Link>
          <Link href="/contact" className="hover:text-white hover:underline transition-colors font-medium">
            Contact us
          </Link>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col space-y-2 text-xs">
          <button 
            onClick={() => handlePlaceholderClick('Careers')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Careers
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Blog')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Blog
          </button>
          <Link href="/help" className="hover:text-white hover:underline transition-colors font-medium">
            Help and Support
          </Link>
          <button 
            onClick={() => handlePlaceholderClick('Affiliate')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Affiliate
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Investors')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            Investors
          </button>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col space-y-2 text-xs">
          <Link href="/terms" className="hover:text-white hover:underline transition-colors font-medium">
            {t('terms.heading')}
          </Link>
          <Link href="/privacy" className="hover:text-white hover:underline transition-colors font-medium">
            {t('privacy.heading')}
          </Link>
          <button 
            onClick={() => handlePlaceholderClick('Cookie Settings')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            {t('footer.cookieSettings')}
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Sitemap')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            {t('footer.sitemap')}
          </button>
          <button 
            onClick={() => handlePlaceholderClick('Accessibility')}
            className="hover:text-white hover:underline transition-colors font-medium text-left border-none bg-transparent cursor-pointer p-0 text-xs text-[#d1d7dc]"
          >
            {t('footer.accessibility')}
          </button>
        </div>

        {/* Column 4: Language Selector with Dropdown */}
        <div className="flex justify-start md:justify-end items-start relative w-full">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="h-[40px] w-full max-w-[180px] px-5 border border-white hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors bg-transparent rounded-[4px] select-none"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="truncate">{language}</span>
          </button>

          {showLangDropdown && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowLangDropdown(false)} />
              
              {/* Dropdown Menu (Opens upward above footer) */}
              <div className="absolute bottom-[48px] right-0 w-full max-w-[180px] bg-[#1c1d1f] border border-[#3d3d3d] shadow-2xl rounded-md py-1.5 z-50 text-xs">
                {(['English', 'Hindi (हिन्दी)', 'Español', 'Deutsch', 'Français'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-white/10 text-white font-medium transition-colors border-none bg-transparent cursor-pointer ${
                      language === lang ? 'text-brand-purple font-bold' : ''
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="max-w-6xl mx-auto w-full border-t border-[#3d3d3d] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="font-extrabold text-lg tracking-tight text-white">
            Cours<span className="text-brand-purple">ify</span>
          </span>
        </Link>
        
        {/* Copyright */}
        <p className="text-[10px] text-gray-500 font-medium">
          © 2026 Coursify, Inc.
        </p>
      </div>

      {/* Floating support toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1c1d1f] border border-[#3d3d3d] px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-[9999] text-xs font-bold text-white select-none animate-slide-up min-w-[320px] justify-between">
          <span className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-brand-purple animate-ping shrink-0" />
            {toastMessage}
          </span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white cursor-pointer border-none bg-transparent ml-3 text-[10px] uppercase font-extrabold shrink-0 tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}
    </footer>
  );
}
