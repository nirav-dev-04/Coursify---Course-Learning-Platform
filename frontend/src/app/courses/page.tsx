'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { CourseListDTO } from '../../lib/types';
import CourseCard from '../../components/CourseCard';
import { CourseCardSkeleton } from '../../components/skeletons';
import { Filter as FilterIcon, RotateCcw, Star, StarHalf, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function CoursesCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  // Filter States
  const [showSidebar, setShowSidebar] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedMinRating, setSelectedMinRating] = useState<number | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Query database based on search query or category filters
  const { data: rawCourses, isLoading, refetch } = useQuery<CourseListDTO[]>({
    queryKey: ['coursesCatalog', queryParam, categoryParam],
    queryFn: async () => {
      let url = '/courses';
      const params = new URLSearchParams();
      if (queryParam) {
        params.append('q', queryParam);
      }
      if (categoryParam) {
        params.append('category', categoryParam);
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      const response = await api.get(url);
      return response.data;
    }
  });

  // Reset all filters when search query or category parameters change
  useEffect(() => {
    handleClearAllFilters();
  }, [queryParam, categoryParam]);

  const handleClearAllFilters = () => {
    setSelectedMinRating(null);
    setSelectedLevels([]);
    setSelectedTopics([]);
    setSelectedLangs([]);
    setSelectedPrices([]);
    setSortBy('popular');
  };

  const handleClearAllSearch = () => {
    handleClearAllFilters();
    router.push('/courses');
  };

  // Helper mapping to derive fields dynamically matching CourseCard behavior
  const processCourses = (coursesList: CourseListDTO[]) => {
    return coursesList.map((course) => {
      // derive rating exactly like CourseCard.tsx
      const rating = (!course.avgRating || course.avgRating === 0) ? Math.round((2.9 + (course.id % 22) * 0.1) * 10) / 10 : course.avgRating;
      const reviews = (!course.avgRating || course.avgRating === 0) ? (85 + (course.id % 24) * 100 + (course.id % 9) * 12) : 15;
      
      // derive level based on title keywords
      let level = 'All Levels';
      const titleLower = course.title.toLowerCase();
      if (titleLower.includes('mastery') || titleLower.includes('masterclass') || titleLower.includes('advanced') || titleLower.includes('deep dive') || titleLower.includes('expert')) {
        level = 'Expert';
      } else if (titleLower.includes('beginner') || titleLower.includes('basics') || titleLower.includes('introduction') || titleLower.includes('absolute')) {
        level = 'Beginner';
      } else if (titleLower.includes('complete') || titleLower.includes('bootcamp') || titleLower.includes('guide') || titleLower.includes('developer')) {
        level = 'Intermediate';
      }

      // derive language based on id modulo
      let language = 'English';
      if (course.id % 3 === 1) language = 'Español';
      else if (course.id % 3 === 2) language = 'Türkçe';

      // derive topic based on keywords first to support interdisciplinary courses
      let topic = 'General Engineering';
      if (titleLower.includes('java') || titleLower.includes('spring')) {
        topic = 'Java Spring Boot';
      } else if (titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('tailwind') || titleLower.includes('frontend')) {
        topic = 'Frontend Dev';
      } else if (titleLower.includes('python')) {
        topic = 'Python Programming';
      } else if (titleLower.includes('trading') || titleLower.includes('finance') || course.category === 'Finance & Trading') {
        topic = 'Finance & Trading';
      } else if (titleLower.includes('ai') || titleLower.includes('data science') || titleLower.includes('machine learning') || course.category === 'AI & Data Science') {
        topic = 'Data Science & AI';
      }

      return {
        ...course,
        derivedRating: rating,
        derivedReviews: reviews,
        derivedLevel: level,
        derivedLanguage: language,
        derivedTopic: topic,
        derivedPriceType: course.price > 0 ? 'Paid' : 'Free'
      };
    });
  };

  // Filter & Sort Logic
  const getFilteredAndSortedCourses = () => {
    if (!rawCourses) return [];
    
    let processed = processCourses(rawCourses);

    // Apply Filter: Min Rating
    if (selectedMinRating !== null) {
      processed = processed.filter(c => c.derivedRating >= selectedMinRating);
    }

    // Apply Filter: Levels
    if (selectedLevels.length > 0) {
      processed = processed.filter(c => selectedLevels.includes(c.derivedLevel));
    }

    // Apply Filter: Topics
    if (selectedTopics.length > 0) {
      processed = processed.filter(c => selectedTopics.includes(c.derivedTopic));
    }

    // Apply Filter: Languages
    if (selectedLangs.length > 0) {
      processed = processed.filter(c => selectedLangs.includes(c.derivedLanguage));
    }

    // Apply Filter: Prices
    if (selectedPrices.length > 0) {
      processed = processed.filter(c => selectedPrices.includes(c.derivedPriceType));
    }

    // Apply Sorting
    return processed.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'rating-desc') {
        return b.derivedRating - a.derivedRating;
      }
      // default: popular (sort by review count descending)
      return b.derivedReviews - a.derivedReviews;
    });
  };

  const filteredCourses = getFilteredAndSortedCourses();

  // Filter Checkbox Handlers
  const handleCheckboxToggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    if (list.includes(val)) {
      setList(list.filter(item => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 <= 0.75;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-brand-gold text-brand-gold shrink-0" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className="w-3.5 h-3.5 fill-brand-gold text-brand-gold shrink-0" />);
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-gray-300 shrink-0" />);
      }
    }
    return stars;
  };

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating-desc', label: 'Highest Rated' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' }
  ];

  const renderFilterContent = () => (
    <>
      {/* Ratings Filter */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b border-brand-grey pb-2">
          {t('catalog.ratings')}
        </h4>
        <div className="space-y-2">
          {[5, 4, 3, 2].map((rate) => (
            <div
              key={rate}
              onClick={() => setSelectedMinRating(selectedMinRating === rate ? null : rate)}
              className="w-full flex items-center gap-2 text-xs font-semibold hover:text-brand-purple transition-colors text-left cursor-pointer py-1 select-none"
            >
              <input 
                type="radio" 
                name="rating-filter"
                checked={selectedMinRating === rate} 
                readOnly
                className="accent-brand-purple cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {renderStars(rate)}
                </div>
                <span className="text-gray-500 font-medium">{rate} {t('catalog.andUp')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Level Filter */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b border-brand-grey pb-2">
          {t('catalog.level')}
        </h4>
        <div className="space-y-2">
          {['All Levels', 'Beginner', 'Intermediate', 'Expert'].map((level) => {
            let translatedLevel = level;
            if (level === 'All Levels') translatedLevel = t('catalog.allLevels');
            else if (level === 'Beginner') translatedLevel = t('catalog.beginner');
            else if (level === 'Intermediate') translatedLevel = t('catalog.intermediate');
            else if (level === 'Expert') translatedLevel = t('catalog.expert');

            return (
              <label key={level} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => handleCheckboxToggle(selectedLevels, setSelectedLevels, level)}
                  className="accent-brand-purple cursor-pointer rounded-sm w-3.5 h-3.5"
                />
                <span>{translatedLevel}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Topic Filter */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b border-brand-grey pb-2">
          {t('catalog.topic')}
        </h4>
        <div className="space-y-2">
          {['Java Spring Boot', 'Python Programming', 'Frontend Dev', 'Finance & Trading', 'Data Science & AI', 'General Engineering'].map((topic) => (
            <label key={topic} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic)}
                onChange={() => handleCheckboxToggle(selectedTopics, setSelectedTopics, topic)}
                className="accent-brand-purple cursor-pointer rounded-sm w-3.5 h-3.5"
              />
              <span>{topic}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language Filter */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b border-brand-grey pb-2">
          {t('catalog.language')}
        </h4>
        <div className="space-y-2">
          {['English', 'Español', 'Türkçe'].map((lang) => (
            <label key={lang} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLangs.includes(lang)}
                onChange={() => handleCheckboxToggle(selectedLangs, setSelectedLangs, lang)}
                className="accent-brand-purple cursor-pointer rounded-sm w-3.5 h-3.5"
              />
              <span>{lang}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider border-b border-brand-grey pb-2">
          {t('catalog.price')}
        </h4>
        <div className="space-y-2">
          {['Paid', 'Free'].map((priceType) => {
            const translatedPrice = priceType === 'Paid' ? t('catalog.paid') : t('catalog.free');
            return (
              <label key={priceType} className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPrices.includes(priceType)}
                  onChange={() => handleCheckboxToggle(selectedPrices, setSelectedPrices, priceType)}
                  className="accent-brand-purple cursor-pointer rounded-sm w-3.5 h-3.5"
                />
                <span>{translatedPrice}</span>
              </label>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow flex flex-col">
      {/* Mobile Filter Drawer Overlay */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-5 space-y-6 shadow-2xl relative z-10 flex flex-col">
            <div className="flex justify-between items-center border-b border-brand-grey pb-3">
              <h3 className="font-extrabold text-sm text-brand-charcoal uppercase tracking-wider">Filters</h3>
              <button 
                onClick={() => setFilterOpen(false)}
                className="text-gray-500 hover:text-brand-purple border-none bg-transparent cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-grow space-y-6 pb-12">
              {renderFilterContent()}
            </div>
          </div>
        </div>
      )}
      
      {/* Search Header Info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-charcoal leading-tight">
          {queryParam ? `${t('catalog.resultsFor')} "${queryParam}"` : categoryParam || t('catalog.allCourses')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {t('catalog.showing')} {rawCourses?.length || 0} {t('catalog.results')}
        </p>
      </div>

      {/* Filter Action Bar (Udemy Style) */}
      <div className="flex items-center justify-between border border-brand-grey bg-white p-3 rounded-[4px] mb-6 select-none relative z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (window.innerWidth < 768) {
                setFilterOpen(true);
              } else {
                setShowSidebar(!showSidebar);
              }
            }}
            className="h-[40px] px-4 border border-brand-charcoal hover:bg-brand-bg text-brand-charcoal font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer rounded-[4px] bg-transparent"
          >
            <FilterIcon className="w-4 h-4 text-brand-purple" />
            <span>{t('catalog.filters')}</span>
          </button>

          {(selectedMinRating !== null || selectedLevels.length > 0 || selectedTopics.length > 0 || selectedLangs.length > 0 || selectedPrices.length > 0) && (
            <button 
              onClick={handleClearAllFilters} 
              className="text-xs font-bold text-brand-purple hover:text-brand-purple-hover flex items-center gap-1 transition-colors cursor-pointer border-none bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t('catalog.clearFilters')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-extrabold text-brand-charcoal hidden md:inline">
            {filteredCourses.length} {t('catalog.results')}
          </span>

          {/* Sort By Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="h-[40px] px-4 border border-brand-charcoal bg-white hover:bg-brand-bg text-brand-charcoal font-bold text-xs flex items-center gap-1.5 cursor-pointer rounded-[4px] min-w-[150px] justify-between"
            >
              <span>{t('catalog.sortBy')}: {sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 mt-1 w-[180px] bg-white border border-brand-grey shadow-xl rounded-md py-1 z-50">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-brand-bg text-xs font-semibold text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer ${
                        sortBy === opt.value ? 'text-brand-purple bg-brand-bg' : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10 w-full">
        {/* 1. Sidebar Filters (Collapsible) — Desktop Only */}
        {showSidebar && (
          <aside className="hidden md:block w-full md:w-[240px] shrink-0 space-y-6 bg-white border border-brand-grey p-5 rounded-[4px] select-none">
            {renderFilterContent()}
          </aside>
        )}



        {/* 2. Course Grid */}
        <section className="flex-grow w-full">
          {isLoading ? (
            <CourseCardSkeleton count={9} />
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-white border border-brand-grey rounded-[4px]">
              <p className="text-gray-500 text-sm font-bold">
                No course listings match your active filters.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="h-[40px] px-6 bg-brand-charcoal text-white font-bold text-xs hover:bg-brand-charcoal-hover transition-colors cursor-pointer border-none"
              >
                Reset Filter Choices
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CoursesCatalogContent />
    </Suspense>
  );
}
