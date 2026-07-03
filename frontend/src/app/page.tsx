'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CourseListDTO } from '../lib/types';
import CourseCard from '../components/CourseCard';
import { HomepageSkeleton } from '../components/skeletons';
import { Flame, Brain, Cpu, TrendingUp, ShieldCheck, ChevronLeft, ChevronRight, GraduationCap, Users, Award, Zap, Play, BookOpen, Code, BarChart3, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  
  const slides = [
    {
      title: 'Courses from ₹479.00',
      description: 'Start building your learning routine today. Offer ends June 18.',
      badge: 'Limited Time Offer',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop',
      bgGradient: 'from-[#eb8a2f]/20 via-[#f4c150]/15 to-white',
      accentColor: 'text-[#eb8a2f]',
      link: '/courses',
      objectPosition: 'object-top'
    },
    {
      title: 'Master In-Demand Tech Skills',
      description: 'Learn Java Spring Boot, React, Next.js, and DevOps from top industry professionals.',
      badge: 'Career Accelerator',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop',
      bgGradient: 'from-[#5624d0]/15 via-[#a435f0]/10 to-white',
      accentColor: 'text-brand-purple',
      link: '/courses?category=Software+Engineering',
      objectPosition: 'object-center'
    },
    {
      title: 'Dive Deep into Generative AI',
      description: 'Build neural networks, train transformers, and design GenAI RAG applications.',
      badge: 'Advanced AI & Data Science',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
      bgGradient: 'from-[#1e6055]/20 via-[#acd2cc]/15 to-white',
      accentColor: 'text-[#1e6055]',
      link: '/courses?category=AI+%26+Data+Science',
      objectPosition: 'object-center'
    }
  ];

  const companies = [
    {
      id: 'volkswagen',
      component: (
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <svg className="w-7 h-7 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M7 7.5l3.5 9h3l3.5-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 7.5l3 8.5h0l3-8.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-bold text-sm tracking-tight">Volkswagen</span>
        </div>
      )
    },
    {
      id: 'samsung',
      component: (
        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <div className="border border-current px-2.5 py-0.5 rounded-full rotate-[-10deg]">
            <span className="font-extrabold text-xs tracking-widest uppercase font-sans">SAMSUNG</span>
          </div>
        </div>
      )
    },
    {
      id: 'cisco',
      component: (
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <div className="flex items-end gap-[2px] h-6 pb-1">
            <span className="w-[2.5px] h-2 bg-current rounded-sm" />
            <span className="w-[2.5px] h-3.5 bg-current rounded-sm" />
            <span className="w-[2.5px] h-5 bg-current rounded-sm" />
            <span className="w-[2.5px] h-6 bg-current rounded-sm" />
            <span className="w-[2.5px] h-5 bg-current rounded-sm" />
            <span className="w-[2.5px] h-3.5 bg-current rounded-sm" />
            <span className="w-[2.5px] h-2 bg-current rounded-sm" />
          </div>
          <span className="font-extrabold text-base tracking-tighter">cisco</span>
        </div>
      )
    },
    {
      id: 'vimeo',
      component: (
        <div className="flex items-center gap-1 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M22.396 7.358c-.066 1.482-1.099 3.518-3.1 6.11-2.079 2.695-3.837 4.043-5.277 4.043-.89 0-1.644-.821-2.261-2.463-.42-1.543-.84-3.087-1.258-4.632-.455-1.745-.944-2.617-1.468-2.617-.11 0-.495.23-.1.693l1.222 1.053c.693.638.693.638.99 2.079l1.353 5.412c.396 1.683.825 2.525 1.287 2.525.792 0 1.947-1.221 3.465-3.663 1.485-2.376 2.26-4.142 2.326-5.297.099-1.287-.363-1.93-1.386-1.93-.495 0-1.056.214-1.683.643 1.056-3.465 3.069-5.115 6.039-4.95 2.178.132 3.201 1.435 3.07 3.905z" />
          </svg>
          <span className="font-extrabold text-base tracking-tighter">vimeo</span>
        </div>
      )
    },
    {
      id: 'citi',
      component: (
        <div className="flex items-center text-gray-400 group-hover:text-gray-500 transition-colors duration-200 relative font-bold text-lg tracking-tight px-1.5">
          <span className="absolute -top-1 left-2 right-2 h-[2px] bg-red-400/80 rounded-full" />
          <span>citi</span>
        </div>
      )
    },
    {
      id: 'ericsson',
      component: (
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <div className="flex gap-[3px]">
            <span className="w-[3px] h-5 bg-current rounded-sm transform skew-x-[-12deg]" />
            <span className="w-[3px] h-5 bg-current rounded-sm transform skew-x-[-12deg]" />
            <span className="w-[3px] h-5 bg-current rounded-sm transform skew-x-[-12deg]" />
          </div>
          <span className="font-black text-sm tracking-widest uppercase">ERICSSON</span>
        </div>
      )
    },
    {
      id: 'hpe',
      component: (
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
          <div className="w-5 h-2.5 border-[2px] border-emerald-500/80 rounded-sm" />
          <span className="font-bold text-xs tracking-wider uppercase font-sans">Hewlett Packard Enterprise</span>
        </div>
      )
    }
  ];

  const [currentSlide, setCurrentSlide] = React.useState(0);

  // Fetch courses via React Query
  const { data: courses, isLoading } = useQuery<CourseListDTO[]>({
    queryKey: ['featuredCourses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  // Fetch trending courses
  const { data: trendingCourses, isLoading: isLoadingTrending } = useQuery<CourseListDTO[]>({
    queryKey: ['coursesTrending'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { sort: 'trending', limit: 8 } });
      return response.data;
    }
  });

  // Fetch newest courses
  const { data: newestCourses, isLoading: isLoadingNewest } = useQuery<CourseListDTO[]>({
    queryKey: ['coursesNewest'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { sort: 'newest', limit: 8 } });
      return response.data;
    }
  });

  // Fetch top rated courses
  const { data: topRatedCourses, isLoading: isLoadingTopRated } = useQuery<CourseListDTO[]>({
    queryKey: ['coursesTopRated'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { sort: 'top-rated', limit: 8 } });
      return response.data;
    }
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (isLoading) {
    return <HomepageSkeleton />;
  }

  const renderCourseSection = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    list: CourseListDTO[] | undefined,
    loading: boolean,
    bgClass = 'bg-white',
    accentClass = 'text-brand-purple'
  ) => {
    return (
      <section className={`py-14 ${bgClass} px-6`}>
        <div className="max-w-6xl mx-auto w-full">
          {/* Section Header */}
          <div className="flex justify-between items-end mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-brand-purple/10 ${accentClass}`}>
                {icon}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-brand-charcoal tracking-tight">
                  {title}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
              </div>
            </div>
            <Link href="/courses" className="text-brand-purple hover:text-brand-purple-hover font-bold text-sm underline select-none cursor-pointer shrink-0">
              See all
            </Link>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full h-[300px] border border-brand-grey bg-brand-white flex flex-col animate-pulse rounded-[20px] p-3 shadow-sm">
                  <div className="bg-gray-200 aspect-[16/10] w-full rounded-[14px] mb-3" />
                  <div className="p-1 flex-grow flex flex-col justify-between space-y-2">
                    <div className="space-y-2">
                      <div className="bg-gray-200 h-4 rounded w-full" />
                      <div className="bg-gray-200 h-3 rounded w-3/4" />
                      <div className="bg-gray-200 h-3 rounded w-1/2" />
                    </div>
                    <div className="bg-gray-200 h-4 rounded w-1/4 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {list?.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO BANNER — Gradient carousel with floating card
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full max-w-6xl mx-auto px-6 py-6 select-none group/slider">
        <div className={`relative w-full min-h-[200px] sm:min-h-[280px] md:min-h-[360px] overflow-hidden shadow-lg border border-brand-grey bg-gradient-to-r ${slides[currentSlide].bgGradient} transition-all duration-700 ease-in-out rounded-[4px]`}>
          
          {/* Slide image — always full width, correct height */}
          <div className="absolute inset-0 w-full h-full">
            <Image 
              src={slides[currentSlide].image} 
              alt="Udemy slide cover" 
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
              className={`object-cover ${slides[currentSlide].objectPosition || 'object-center'}`}
            />
            {/* White to transparent gradient overlay on the left for text card readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent hidden md:block z-10 w-1/2" />
          </div>

          {/* Floating White Card — DESKTOP ONLY */}
          <div className="hidden md:block absolute left-16 top-1/2 -translate-y-1/2 w-[350px] bg-white p-6 shadow-xl z-20 space-y-3.5 border border-brand-grey/50 rounded-[4px]">
            <span className={`inline-block px-2 py-0.5 bg-brand-bg text-[9px] font-extrabold uppercase tracking-widest rounded ${slides[currentSlide].accentColor}`}>
              {slides[currentSlide].badge}
            </span>
            <h1 className="text-2xl font-extrabold text-brand-charcoal leading-snug">
              {slides[currentSlide].title}
            </h1>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              {slides[currentSlide].description}
            </p>
            <div className="pt-1">
              <Link href={slides[currentSlide].link} className="h-[38px] px-5 bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs inline-flex items-center justify-center transition-colors cursor-pointer rounded-[4px]">
                Explore Catalog
              </Link>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-charcoal hover:bg-brand-charcoal-hover text-white flex items-center justify-center cursor-pointer shadow z-30 transition-opacity opacity-0 group-hover/slider:opacity-100 border-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-charcoal hover:bg-brand-charcoal-hover text-white flex items-center justify-center cursor-pointer shadow z-30 transition-opacity opacity-0 group-hover/slider:opacity-100 border-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Floating card on MOBILE — below slider as normal block */}
        <div className="md:hidden mt-4 bg-white p-5 border border-brand-grey rounded-[4px] space-y-3 shadow-sm">
          <span className={`inline-block px-2 py-0.5 bg-brand-bg text-[9px] font-extrabold uppercase tracking-widest rounded ${slides[currentSlide].accentColor}`}>
            {slides[currentSlide].badge}
          </span>
          <h1 className="text-xl font-extrabold text-brand-charcoal leading-snug">
            {slides[currentSlide].title}
          </h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {slides[currentSlide].description}
          </p>
          <div className="pt-1">
            <Link href={slides[currentSlide].link} className="h-[38px] px-5 bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs inline-flex items-center justify-center transition-colors cursor-pointer rounded-[4px] w-full">
              Explore Catalog
            </Link>
          </div>
        </div>

        {/* Slide Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-300 border-none cursor-pointer ${
                currentSlide === idx
                  ? 'w-8 h-2 bg-brand-purple'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. PLATFORM STATS — Social proof numbers strip
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-gradient-to-r from-[#1c1d1f] via-[#2d2f31] to-[#1c1d1f] px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '210K+', label: 'Online Courses', icon: <Play className="w-5 h-5" /> },
            { value: '62M+', label: 'Students Worldwide', icon: <Users className="w-5 h-5" /> },
            { value: '75K+', label: 'Expert Instructors', icon: <GraduationCap className="w-5 h-5" /> },
            { value: '830M+', label: 'Course Enrollments', icon: <Award className="w-5 h-5" /> },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 group">
              <div className="text-brand-purple opacity-70 group-hover:opacity-100 transition-opacity">
                {stat.icon}
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. BROWSE BY CATEGORY — Visual category cards with gradient
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-[#F7F9FA]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-brand-charcoal tracking-tight">
              {t('home.browseHeading')}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-2 max-w-lg mx-auto">
              Choose from over 210,000 online courses with new additions published every month
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Software Engineering */}
            <Link href="/courses?category=Software+Engineering" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#5624d0] to-[#8b5cf6] p-6 text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer min-h-[180px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg leading-tight">Software Engineering</h3>
                <p className="text-white/70 text-xs mt-1.5 font-medium">Java, Spring Boot, React, DevOps</p>
              </div>
              <div className="relative z-10 flex items-center gap-1 text-white/60 text-xs font-bold mt-4 group-hover:text-white/90 transition-colors">
                <span>Explore courses</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* AI & Data Science */}
            <Link href="/courses?category=AI+%26+Data+Science" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f766e] to-[#14b8a6] p-6 text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer min-h-[180px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg leading-tight">AI & Data Science</h3>
                <p className="text-white/70 text-xs mt-1.5 font-medium">PyTorch, LLMs, Neural Nets, NLP</p>
              </div>
              <div className="relative z-10 flex items-center gap-1 text-white/60 text-xs font-bold mt-4 group-hover:text-white/90 transition-colors">
                <span>Explore courses</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Finance & Trading */}
            <Link href="/courses?category=Finance+%26+Trading" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#b45309] to-[#f59e0b] p-6 text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer min-h-[180px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg leading-tight">Finance & Trading</h3>
                <p className="text-white/70 text-xs mt-1.5 font-medium">Options, Stock Charts, Algorithms</p>
              </div>
              <div className="relative z-10 flex items-center gap-1 text-white/60 text-xs font-bold mt-4 group-hover:text-white/90 transition-colors">
                <span>Explore courses</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. COURSE SECTIONS — Each with icon, title, and horizontal grid
          ═══════════════════════════════════════════════════════════════════ */}
      {renderCourseSection(
        t('home.featuredHeading'),
        'Hand-picked by our editorial team for quality and relevance',
        <Sparkles className="w-5 h-5" />,
        courses?.slice(0, 8),
        isLoading,
        'bg-white'
      )}

      {renderCourseSection(
        'Trending Now',
        'Most popular courses this week among our learners',
        <Flame className="w-5 h-5" />,
        trendingCourses,
        isLoadingTrending,
        'bg-[#F7F9FA]'
      )}

      {renderCourseSection(
        'New Releases',
        'Fresh courses just published — be among the first to learn',
        <Zap className="w-5 h-5" />,
        newestCourses,
        isLoadingNewest,
        'bg-white'
      )}

      {renderCourseSection(
        'Top Rated',
        'Highest-rated courses across all categories',
        <Award className="w-5 h-5" />,
        topRatedCourses,
        isLoadingTopRated,
        'bg-[#F7F9FA]'
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. PLATFORM VALUE PROPS — Why learn on Coursify
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-t border-brand-grey px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-brand-charcoal tracking-tight">
              Why learn on Coursify?
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-2">
              Built for the best learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-[#F7F9FA] rounded-xl p-6 border border-brand-grey hover:border-brand-purple/30 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-brand-charcoal mb-2">Adaptive HLS Streaming</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Smooth adaptive bitrate video streaming (240p - 720p) prevents buffering on any connection speed.</p>
            </div>

            <div className="group bg-[#F7F9FA] rounded-xl p-6 border border-brand-grey hover:border-brand-purple/30 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-brand-charcoal mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Idempotent transaction handling and pessimistic locking prevent duplicate payment charges.</p>
            </div>

            <div className="group bg-[#F7F9FA] rounded-xl p-6 border border-brand-grey hover:border-brand-purple/30 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-brand-charcoal mb-2">Learn Anywhere</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Access your courses on any device with responsive design and offline-ready architecture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. BECOME AN INSTRUCTOR — CTA Banner
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-[#5624d0] via-[#a435f0] to-[#5624d0] px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-60 h-60 bg-white/5 rounded-full -ml-20 -mt-20" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mb-10" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <GraduationCap className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
            Become an Instructor
          </h2>
          <p className="text-white/80 text-sm font-medium max-w-lg mx-auto mb-6 leading-relaxed">
            Instructors from around the world teach millions of learners on Coursify. 
            We provide the tools and skills to teach what you love.
          </p>
          <Link 
            href="/instructor" 
            className="inline-flex items-center justify-center h-[44px] px-8 bg-white text-brand-purple font-extrabold text-sm rounded-[4px] hover:bg-gray-100 transition-colors cursor-pointer shadow-lg"
          >
            Start teaching today
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. TRUSTED COMPANIES — Scrolling logo marquee
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white border-t border-brand-grey overflow-hidden select-none">
        <div className="max-w-6xl mx-auto w-full text-center px-6 mb-8">
          <p className="text-gray-500 font-bold text-sm">
            Coursify is trusted by over 17,000 companies and millions of learners around the world
          </p>
        </div>

        {/* Marquee Outer Container */}
        <div className="relative w-full overflow-hidden py-4">
          {/* Gradient shadows on sides for premium look */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee flex gap-16 items-center">
            {/* First Set of Logos */}
            {companies.map((company, index) => (
              <div key={`comp-1-${index}`} className="shrink-0 hover:text-brand-purple transition-colors duration-200">
                {company.component}
              </div>
            ))}
            {/* Second Set of Logos (Duplicate to make loop seamless) */}
            {companies.map((company, index) => (
              <div key={`comp-2-${index}`} className="shrink-0 hover:text-brand-purple transition-colors duration-200">
                {company.component}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
