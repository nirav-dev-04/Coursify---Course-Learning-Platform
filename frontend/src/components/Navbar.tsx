'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../store/useCartStore';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { ShoppingCart, LogOut, BookOpen, Search, User, Heart, Menu, X, Globe } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, logout, checkSession } = useAuth();

  const { items, fetchCart } = useCartStore();
  const { language, setLanguage, t } = useLanguage();
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Sync search input value with page navigation
  useEffect(() => {
    if (pathname === '/courses') {
      setSearchTerm(searchParams.get('q') || '');
    } else if (pathname.startsWith('/courses/')) {
      // Keep current search term (e.g. clicked suggestion title) on course detail pages
    } else {
      setSearchTerm('');
    }
  }, [pathname, searchParams]);

  // Auto-close drawers on route transition
  useEffect(() => {
    setIsDrawerOpen(false);
    setShowMobileSearch(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Dynamically extract related search keywords and phrases (Google style suggestions)
  const dynamicKeywords = React.useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return [];

    const phrases = new Set<string>();

    // 1. If we have matching categories, suggest them
    suggestions.forEach(course => {
      if (course.category && course.category.toLowerCase().includes(query)) {
        phrases.add(course.category);
      }
    });

    // 2. Extract words and compound phrases starting with or containing query from titles
    suggestions.forEach(course => {
      const title = course.title;
      const titleLower = title.toLowerCase();

      // Split title into words and check if any words start with the query
      const words = title.split(/[\s,.:;&()\-]+/);
      words.forEach((word: string) => {
        const cleanWord = word.trim().replace(/[^\w\s]/g, '');
        if (cleanWord.toLowerCase().startsWith(query) && cleanWord.length >= query.length) {
          // Capitalize first letter for premium look
          phrases.add(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1));
        }
      });

      // Find the match in the title and extract the phrase from that point forward
      const index = titleLower.indexOf(query);
      if (index !== -1) {
        // Extract 2 to 3 words starting from matching segment
        const segment = title.slice(index);
        const segmentsWords = segment.split(/\s+/).slice(0, 3).join(' ');
        const cleanPhrase = segmentsWords.replace(/[^\w\s]/g, '').trim();
        if (cleanPhrase.length >= query.length) {
          phrases.add(cleanPhrase.charAt(0).toUpperCase() + cleanPhrase.slice(1));
        }
      }
    });

    // Add baseline query term with capital first letter
    const capitalizedQuery = searchTerm.trim().charAt(0).toUpperCase() + searchTerm.trim().slice(1);
    if (phrases.size > 0 && !Array.from(phrases).some(p => p.toLowerCase() === query)) {
      phrases.add(capitalizedQuery);
    }

    // Fallback static popular searches if query doesn't match any courses
    if (phrases.size === 0) {
      const defaultKeywords = ['Java', 'Python', 'React', 'DevOps', 'Machine learning', 'Forex'];
      defaultKeywords.filter(k => k.toLowerCase().includes(query)).forEach(k => phrases.add(k));
    }

    return Array.from(phrases).slice(0, 5);
  }, [searchTerm, suggestions]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Only search/fire suggestions when characters are at least 1
    if (searchTerm.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    // Increased debounce threshold to 400ms to optimize performance and reduce DB load
    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await api.get('/courses', {
          params: { q: searchTerm.trim() }
        });
        setSuggestions(response.data.slice(0, 6)); // Show up to 6 suggestions
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchTerm.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/courses');
    }
  };

  return (
    <>
      <nav className="h-[56px] px-6 border-b border-brand-grey bg-brand-white flex items-center justify-between sticky top-0 z-50 w-full">
        {/* Hamburger Toggle Button (Mobile) */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -ml-2 mr-2 hover:bg-brand-bg rounded-md text-brand-charcoal md:hidden border-none bg-transparent cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-[24px] h-[24px]" />
        </button>

        {/* 1. Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6 shrink-0 group">
          <div className="w-[32px] h-[32px] bg-brand-purple rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(164,53,240,0.4)]">
            <svg
              className="w-[20px] h-[20px] text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-brand-charcoal select-none">
            Cours<span className="text-brand-purple">ify</span>
          </span>
        </Link>

        {/* 2. Categories Links with Hover Menu (hidden on mobile) */}
        <div className="relative group mr-6 hidden md:block">
          <Link href="/courses" className="text-sm font-medium text-brand-charcoal hover:text-brand-purple transition-colors h-[56px] flex items-center gap-1 cursor-pointer">
            {t('navbar.categories')}
          </Link>
          {/* Cascade Hover Dropdown */}
          <div className="absolute left-0 top-[38px] w-[240px] bg-white border border-brand-grey shadow-xl rounded-b-md hidden group-hover:block z-50">
            <div className="py-2">
              {/* Software Engineering Category */}
              <div className="relative group/sub px-4 py-3 text-sm text-brand-charcoal hover:bg-brand-bg hover:text-brand-purple flex items-center justify-between cursor-pointer">
                <Link href="/courses?category=Software+Engineering" className="font-medium w-full">
                  Software Engineering
                </Link>
                <span className="text-gray-400">➔</span>
                {/* Level 2 Sub-dropdown */}
                <div className="absolute left-full top-0 ml-0.5 w-[220px] bg-white border border-brand-grey shadow-xl rounded-md hidden group-hover/sub:block py-2 z-50 text-brand-charcoal">
                  <Link href="/courses?q=React&category=Software+Engineering" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    React & Next.js
                  </Link>
                  <Link href="/courses?q=Java&category=Software+Engineering" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Java Spring Boot
                  </Link>
                  <Link href="/courses?q=DevOps&category=Software+Engineering" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Docker & Kubernetes
                  </Link>
                  <Link href="/courses?q=Go&category=Software+Engineering" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Go Programming
                  </Link>
                </div>
              </div>

              {/* AI & Data Science Category */}
              <div className="relative group/sub px-4 py-3 text-sm text-brand-charcoal hover:bg-brand-bg hover:text-brand-purple flex items-center justify-between cursor-pointer">
                <Link href="/courses?category=AI+%26+Data+Science" className="font-medium w-full">
                  AI & Data Science
                </Link>
                <span className="text-gray-400">➔</span>
                {/* Level 2 Sub-dropdown */}
                <div className="absolute left-full top-0 ml-0.5 w-[220px] bg-white border border-brand-grey shadow-xl rounded-md hidden group-hover/sub:block py-2 z-50 text-brand-charcoal">
                  <Link href="/courses?q=Generative+AI&category=AI+%26+Data+Science" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Generative AI & LLMs
                  </Link>
                  <Link href="/courses?q=Deep+Learning&category=AI+%26+Data+Science" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Deep Learning & PyTorch
                  </Link>
                  <Link href="/courses?q=Data+Science&category=AI+%26+Data+Science" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Data Science & Machine Learning
                  </Link>
                  <Link href="/courses?q=Tableau&category=AI+%26+Data+Science" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Tableau & BI Dashboards
                  </Link>
                </div>
              </div>

              {/* Finance & Trading Category */}
              <div className="relative group/sub px-4 py-3 text-sm text-brand-charcoal hover:bg-brand-bg hover:text-brand-purple flex items-center justify-between cursor-pointer">
                <Link href="/courses?category=Finance+%26+Trading" className="font-medium w-full">
                  Finance & Trading
                </Link>
                <span className="text-gray-400">➔</span>
                {/* Level 2 Sub-dropdown */}
                <div className="absolute left-full top-0 ml-0.5 w-[220px] bg-white border border-brand-grey shadow-xl rounded-md hidden group-hover/sub:block py-2 z-50 text-brand-charcoal">
                  <Link href="/courses?q=Technical+Analysis&category=Finance+%26+Trading" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Stock Market & Charting
                  </Link>
                  <Link href="/courses?q=Algorithmic&category=Finance+%26+Trading" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Algorithmic Trading
                  </Link>
                  <Link href="/courses?q=Cryptocurrency&category=Finance+%26+Trading" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Crypto & Blockchain
                  </Link>
                  <Link href="/courses?q=Options&category=Finance+%26+Trading" className="block px-4 py-2.5 hover:bg-brand-bg hover:text-brand-purple text-xs font-medium">
                    Options & Forex Trading
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Search Bar with Autocomplete (hidden on mobile) */}
        <div className="flex-grow max-w-[600px] relative mr-6 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="w-full flex items-center border-[1.5px] border-brand-charcoal rounded-[4px] h-[38px] overflow-hidden bg-white hover:border-brand-purple focus-within:border-brand-purple transition-colors">
            <input
              type="text"
              placeholder={t('navbar.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="flex-grow h-full px-[14px] bg-transparent text-sm focus:outline-none text-brand-charcoal placeholder-gray-500 font-medium"
            />
            <button type="submit" className="h-full bg-brand-charcoal hover:bg-brand-charcoal-hover px-4 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 border-none">
              <Search className="w-[16px] h-[16px]" />
            </button>
          </form>

          {/* Floating Autocomplete Suggestions Dropdown */}
          {showSuggestions && searchTerm.trim().length >= 1 && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
              
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-brand-grey shadow-2xl rounded-md z-50 overflow-hidden divide-y divide-brand-grey max-h-[460px] overflow-y-auto">
                
                {/* Keyword Searches */}
                {dynamicKeywords.length > 0 && (
                  <div className="py-2">
                    {dynamicKeywords.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setSearchTerm(term);
                          setShowSuggestions(false);
                          router.push(`/courses?q=${encodeURIComponent(term)}`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-brand-bg flex items-center gap-3 text-sm text-brand-charcoal font-semibold hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{term}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Course Matches */}
                <div className="py-2">
                  <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                    {t('navbar.suggestedCourses')}
                  </p>
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-xs text-gray-500 font-medium">
                      {t('navbar.loading')}
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setSearchTerm('');
                          setShowSuggestions(false);
                          router.push(`/courses/${course.slug}`);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand-bg flex items-start gap-3 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold text-brand-charcoal line-clamp-1">
                            {course.title}
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                            Course • {course.instructorName || 'Instructor'} • <span className="font-semibold text-brand-purple">{course.category}</span>
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500 font-medium">
                      {t('navbar.noSuggestions')}
                    </div>
                  )}
                </div>

                {/* Instructor Matches */}
                {!loadingSuggestions && suggestions.length > 0 && (
                  <div className="py-2 bg-[#F7F9FA]">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                      {t('navbar.matchingInstructors')}
                    </p>
                    {/* Extract unique instructors from matching courses */}
                    {Array.from(new Set(suggestions.map(c => c.instructorName))).slice(0, 2).map((instructorName) => (
                      <button
                        key={instructorName}
                        onClick={() => {
                          setSearchTerm(instructorName);
                          setShowSuggestions(false);
                          router.push(`/courses?q=${encodeURIComponent(instructorName)}`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-brand-bg flex items-center gap-3 text-xs text-brand-charcoal font-semibold transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <span>{instructorName}</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-2">• Instructor</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 4. Actions (Cart & Auth) */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-[44px] h-[44px] flex items-center justify-center hover:bg-brand-bg rounded-full text-brand-charcoal hover:text-brand-purple transition-colors md:hidden border-none bg-transparent cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-[20px] h-[20px]" />
          </button>

          {/* Cart Trigger */}
          <Link href="/cart" className="relative w-[44px] h-[44px] flex items-center justify-center hover:bg-brand-bg rounded-full text-brand-charcoal hover:text-brand-purple transition-colors">
            <ShoppingCart className="w-[20px] h-[20px]" />
            {items.length > 0 && (
              <span className="absolute top-1 right-1 bg-brand-purple text-white text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center border border-brand-white animate-pulse">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            // Authenticated User Menu
            <div className="flex items-center gap-4">
              <Link href="/my-courses" className="text-sm font-medium text-brand-charcoal hover:text-brand-purple transition-colors hidden sm:block">
                {t('navbar.learning')}
              </Link>
              
              <Link href="/wishlist" className="text-sm font-medium text-brand-charcoal hover:text-brand-purple transition-colors hidden sm:block">
                Wishlist
              </Link>
              
              <Link href="/instructor" className="text-sm font-medium text-brand-charcoal hover:text-brand-purple transition-colors hidden sm:block">
                {user.role === 'INSTRUCTOR' || user.role === 'ADMIN' ? 'Instructor dashboard' : 'Teach on Coursify'}
              </Link>

              {/* Profile Menu dropdown trigger (Hover-driven premium layout) */}
              <div className="relative group py-2">
                <Link 
                  href="/user/settings"
                  className="w-[44px] h-[44px] md:w-8 md:h-8 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-sm hover:bg-brand-charcoal-hover transition-colors select-none focus:outline-none cursor-pointer overflow-hidden border border-brand-grey shadow-sm"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2) || user.name.charAt(0).toUpperCase()
                  )}
                </Link>
                
                {/* Dropdown Menu - Udemy style */}
                <div className="absolute right-0 top-full mt-0 w-72 bg-white border border-brand-grey shadow-2xl rounded-[4px] py-1 z-50 hidden md:group-hover:block divide-y divide-brand-grey text-xs select-none max-h-[calc(100vh-75px)] overflow-y-auto sleek-scrollbar">
                  {/* User Profile Header */}
                  <div className="p-3.5 flex items-center gap-3">
                    <Link 
                      href="/user/settings"
                      className="w-[44px] h-[44px] rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-base cursor-pointer shrink-0 overflow-hidden"
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2) || user.name.charAt(0).toUpperCase()
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link href="/user/settings" className="font-extrabold text-sm text-brand-charcoal hover:text-brand-charcoal block truncate cursor-pointer">
                        {user.name}
                      </Link>
                      <p className="text-[10px] text-gray-500 truncate font-medium mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Section 1: Core navigation */}
                  <div className="py-0.5">
                    <Link href="/my-courses" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      My learning
                    </Link>
                    <Link href="/cart" className="px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal flex items-center justify-between transition-colors">
                      <span>My cart</span>
                      {items.length > 0 && (
                        <span className="bg-brand-charcoal text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border border-brand-white">
                          {items.length}
                        </span>
                      )}
                    </Link>
                    <Link href="/wishlist" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Wishlist
                    </Link>
                    <Link href="/instructor" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' ? 'Instructor dashboard' : 'Teach on Coursify'}
                    </Link>
                  </div>

                  {/* Section 2: Mock communications */}
                  <div className="py-0.5">
                    <button className="w-full text-left px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer">
                      Notifications
                    </button>
                    <button className="w-full text-left px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer">
                      Messages
                    </button>
                  </div>

                  {/* Section 3: Billing & Settings */}
                  <div className="py-0.5">
                    <Link href="/user/settings?tab=security" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Account settings
                    </Link>
                    <Link href="/user/settings?tab=payment" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Payment methods
                    </Link>
                    <Link href="/user/settings?tab=subscriptions" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Subscriptions
                    </Link>
                    <button className="w-full text-left px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer">
                      Coursify credits
                    </button>
                    <Link href="/user/settings?tab=history" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Purchase history
                    </Link>
                  </div>

                  {/* Section 4: Preferences */}
                  <div className="py-0.5">
                    <div className="px-4 py-1 font-semibold text-brand-charcoal">
                      <button 
                        type="button"
                        onClick={() => setShowLangSubmenu(!showLangSubmenu)}
                        className="w-full text-left font-semibold text-brand-charcoal flex items-center justify-between hover:bg-brand-bg py-1 px-2 -mx-2 rounded transition-colors border-none bg-transparent cursor-pointer text-xs"
                      >
                        <span>Language</span>
                        <span className="text-brand-purple flex items-center gap-1 font-bold">
                          {language} <Globe className="w-3.5 h-3.5" />
                        </span>
                      </button>
                      
                      {showLangSubmenu && (
                        <div className="mt-1.5 pl-2 border-l border-brand-grey flex flex-col gap-1">
                          {(['English', 'Hindi (हिन्दी)', 'Español', 'Deutsch', 'Français'] as const).map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setLanguage(lang);
                              }}
                              className={`w-full text-left py-1.5 px-2 hover:bg-brand-bg text-[11px] font-semibold transition-colors border-none bg-transparent cursor-pointer rounded ${
                                language === lang ? 'text-brand-purple font-extrabold bg-brand-bg/50' : 'text-gray-500'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 5: Profile links */}
                  <div className="py-0.5">
                    <Link href="/user/settings?tab=profile" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Public profile
                    </Link>
                    <Link href="/user/settings?tab=profile" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Edit profile
                    </Link>
                  </div>

                  {/* Section 6: Action */}
                  <div className="py-0.5">
                    <Link href="/help" className="block px-4 py-1.5 hover:bg-brand-bg hover:text-brand-charcoal font-semibold text-brand-charcoal transition-colors">
                      Help and Support
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-brand-bg text-red-600 hover:text-red-700 font-semibold flex items-center justify-between transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <span>Log out</span>
                    </button>
                  </div>

                  {/* Section 7: Premium Udemy Business promo */}
                  <div className="p-3 bg-[#F7F9FA] rounded-b-[4px]">
                    <div className="font-extrabold text-[13px] text-brand-charcoal leading-tight">Coursify Business</div>
                    <div className="text-[9px] text-gray-500 font-medium mt-1">Bring learning to your company</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Unauthenticated Actions
            <div className="flex items-center gap-2">
              <Link href="/login" className="h-[36px] px-3.5 border border-brand-charcoal text-brand-charcoal text-xs font-bold flex items-center justify-center hover:bg-brand-bg transition-colors cursor-pointer rounded-[4px] bg-transparent">
                {t('navbar.login')}
              </Link>
              <Link href="/register" className="h-[36px] px-3.5 bg-brand-charcoal hover:bg-brand-charcoal-hover text-brand-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer rounded-[4px]">
                {t('navbar.signup')}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer (Left Slide-in) */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-charcoal/50 z-[90] md:hidden animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[100] md:hidden shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 animate-out slide-out-to-left">
            {/* Header */}
            <div className="p-4 border-b border-brand-grey flex items-center justify-between">
              <span className="font-extrabold text-lg text-brand-charcoal">
                Cours<span className="text-brand-purple">ify</span>
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-[44px] h-[44px] flex items-center justify-center hover:bg-brand-bg rounded-full text-brand-charcoal border-none bg-transparent cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto py-4">
              {/* User Greeting (if logged in) */}
              {user && (
                <div className="px-6 pb-4 border-b border-brand-grey mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-base overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hello,</p>
                      <p className="text-sm font-bold text-brand-charcoal truncate max-w-[170px]">{user.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex flex-col text-sm font-semibold text-brand-charcoal">
                <p className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                  Navigation
                </p>
                <Link
                  href="/courses"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-3 hover:bg-brand-bg hover:text-brand-purple transition-colors flex items-center justify-between"
                >
                  All Courses
                </Link>

                {/* Categories Sub-Accordion */}
                <div className="border-t border-b border-brand-grey py-1 my-2 bg-brand-bg/30">
                  <p className="px-6 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                    Categories
                  </p>
                  <Link
                    href="/courses?category=Software+Engineering"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-8 py-2.5 hover:text-brand-purple transition-colors block text-xs"
                  >
                    Software Engineering
                  </Link>
                  <Link
                    href="/courses?category=AI+%26+Data+Science"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-8 py-2.5 hover:text-brand-purple transition-colors block text-xs"
                  >
                    AI & Data Science
                  </Link>
                  <Link
                    href="/courses?category=Finance+%26+Trading"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-8 py-2.5 hover:text-brand-purple transition-colors block text-xs"
                  >
                    Finance & Trading
                  </Link>
                </div>

                {user ? (
                  <>
                    <Link
                      href="/my-courses"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-6 py-3 hover:bg-brand-bg hover:text-brand-purple transition-colors"
                    >
                      {t('navbar.learning')}
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-6 py-3 hover:bg-brand-bg hover:text-brand-purple transition-colors"
                    >
                      Wishlist
                    </Link>
                    <Link
                      href="/user/settings"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-6 py-3 hover:bg-brand-bg hover:text-brand-purple transition-colors"
                    >
                      Account settings
                    </Link>
                    <div className="px-6 py-3 hover:bg-brand-bg transition-colors">
                      <button 
                        type="button"
                        onClick={() => setShowLangSubmenu(!showLangSubmenu)}
                        className="w-full text-left font-semibold text-brand-charcoal flex items-center justify-between border-none bg-transparent cursor-pointer text-sm"
                      >
                        <span>Language</span>
                        <span className="text-brand-purple flex items-center gap-1 font-bold">
                          {language} <Globe className="w-4 h-4" />
                        </span>
                      </button>
                      
                      {showLangSubmenu && (
                        <div className="mt-2 pl-4 border-l-2 border-brand-purple flex flex-col gap-1.5">
                          {(['English', 'Hindi (हिन्दी)', 'Español', 'Deutsch', 'Français'] as const).map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setLanguage(lang);
                                setIsDrawerOpen(false);
                              }}
                              className={`w-full text-left py-2 px-2 hover:bg-brand-bg text-xs font-semibold transition-colors border-none bg-transparent cursor-pointer rounded ${
                                language === lang ? 'text-brand-purple font-extrabold bg-brand-bg/30' : 'text-gray-500'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {user.role === 'INSTRUCTOR' && (
                      <Link
                        href="/instructor/dashboard"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-6 py-3 hover:bg-brand-bg hover:text-brand-purple transition-colors"
                      >
                        {t('navbar.instructor')}
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-4 flex flex-col gap-2 mt-2">
                    <Link
                      href="/login"
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full h-[40px] border border-brand-charcoal text-brand-charcoal text-xs font-bold flex items-center justify-center hover:bg-brand-bg transition-colors rounded-[4px] bg-transparent"
                    >
                      {t('navbar.login')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-full h-[40px] bg-brand-charcoal hover:bg-brand-charcoal-hover text-brand-white text-xs font-bold flex items-center justify-center transition-colors rounded-[4px]"
                    >
                      {t('navbar.signup')}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with signout */}
            {user && (
              <div className="p-4 border-t border-brand-grey bg-brand-bg/20">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border border-red-200 rounded-md font-semibold bg-transparent cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {t('navbar.signout')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col p-4 animate-in fade-in duration-200">
          {/* Header of Overlay */}
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={handleSearchSubmit} className="flex-grow flex items-center border-[1.5px] border-brand-charcoal rounded-[4px] h-[42px] overflow-hidden bg-white">
              <input
                type="text"
                placeholder={t('navbar.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                className="flex-grow h-full px-[14px] bg-transparent text-sm focus:outline-none text-brand-charcoal placeholder-gray-500 font-medium"
                autoFocus
              />
              <button type="submit" className="h-full bg-brand-charcoal hover:bg-brand-charcoal-hover px-4 flex items-center justify-center text-white border-none shrink-0 cursor-pointer">
                <Search className="w-[16px] h-[16px]" />
              </button>
            </form>
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setSearchTerm('');
              }}
              className="w-[44px] h-[44px] flex items-center justify-center hover:bg-brand-bg rounded-full text-brand-charcoal border-none bg-transparent cursor-pointer"
              aria-label="Close Search"
            >
              <X className="w-[24px] h-[24px]" />
            </button>
          </div>

          {/* Search Suggestions list in the overlay */}
          {searchTerm.trim().length >= 1 && (
            <div className="flex-grow overflow-y-auto divide-y divide-brand-grey">
              {/* Keyword Searches */}
              {dynamicKeywords.length > 0 && (
                <div className="py-2">
                  {dynamicKeywords.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchTerm(term);
                        setShowMobileSearch(false);
                        router.push(`/courses?q=${encodeURIComponent(term)}`);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-brand-bg flex items-center gap-3 text-sm text-brand-charcoal font-semibold hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Course Matches */}
              <div className="py-2">
                <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                  {t('navbar.suggestedCourses')}
                </p>
                {loadingSuggestions ? (
                  <div className="px-4 py-3 text-xs text-gray-500 font-medium">
                    {t('navbar.loading')}
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSearchTerm('');
                        setShowMobileSearch(false);
                        router.push(`/courses/${course.slug}`);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-brand-bg flex items-start gap-3 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-brand-charcoal line-clamp-2">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                          {course.category}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 font-medium">
                    {t('navbar.noSuggestions')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
