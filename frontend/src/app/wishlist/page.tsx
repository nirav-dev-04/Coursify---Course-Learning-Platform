'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '../../store/useWishlistStore';
import CourseCard from '../../components/CourseCard';
import { Heart, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WishlistPage() {
  const { t } = useLanguage();
  const { items } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10 flex-grow flex flex-col">
      <h1 className="text-3xl font-extrabold text-brand-charcoal mb-2">My Wishlist</h1>
      <p className="text-sm text-gray-500 mb-8 font-medium">
        {items.length} {items.length === 1 ? 'course' : 'courses'} in wishlist
      </p>

      {items.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-16 border border-dashed border-brand-grey bg-[#F7F9FA] rounded-md shadow-sm">
          <div className="p-4 bg-purple-50 rounded-full text-brand-purple mb-4">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-extrabold text-lg text-brand-charcoal mb-1">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 font-medium max-w-[280px] mb-6">
            Explore our catalog of premium courses and add them to your wishlist to buy or subscribe later.
          </p>
          <Link 
            href="/courses" 
            className="h-[40px] px-6 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold flex items-center justify-center transition-colors rounded cursor-pointer select-none"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
