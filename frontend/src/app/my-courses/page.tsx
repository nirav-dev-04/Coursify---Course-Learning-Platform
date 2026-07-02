'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Enrollment } from '../../lib/types';
import { useAuth } from '../../hooks/useAuth';
import { PlayCircle, Award, Loader2, BookOpen } from 'lucide-react';
import { getCourseThumbnail } from '../../lib/utils/thumbnail';

export default function MyCoursesPage() {
  const { user } = useAuth();

  // Fetch enrolled courses for the logged-in student
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['myCourses'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my-courses');
      return response.data;
    },
    enabled: !!user, // Fetch only if user is logged in
  });

  return (
    <div className="flex-grow flex flex-col">
      {/* 1. Header Banner */}
      <section className="bg-brand-charcoal py-12 px-6 md:px-12 text-white border-b border-brand-charcoal-hover select-none">
        <div className="max-w-6xl mx-auto w-full space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            My Learning
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Welcome back, <span className="text-white font-bold">{user?.name}</span>. Continue your learning path below.
          </p>
        </div>
      </section>

      {/* 2. Grid Container */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {enrollments.map((enrollment) => {
              const { course } = enrollment;
              
              return (
                <div 
                  key={enrollment.id} 
                  className="group bg-brand-white border border-brand-grey flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="h-[145px] w-full relative overflow-hidden select-none">
                    <img 
                      src={getCourseThumbnail(course.category, course.slug, course.title)} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Hover Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <PlayCircle className="w-12 h-12 text-white fill-brand-purple/20" />
                    </div>
                  </div>

                  {/* Meta Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {course.category}
                      </span>
                      <h3 className="font-bold text-sm text-brand-charcoal line-clamp-2 mt-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        By {course.instructor?.name || 'Instructor'}
                      </p>
                    </div>

                    {/* Progress tracking information and button */}
                    <div className="space-y-3 pt-2 border-t border-brand-grey">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-bold select-none">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Start Learning
                        </span>
                      </div>
                      
                      <Link 
                        href={`/learn/${course.id}`} 
                        className="h-[40px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        Go to course player
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State Dashboard
          <div className="py-20 text-center space-y-6 max-w-md mx-auto">
            <Award className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-xl font-bold text-brand-charcoal">
              Start learning something new today
            </h3>
            <p className="text-sm text-gray-500">
              You haven't enrolled in any courses yet. Browse our comprehensive catalog to find topics in coding, finance, or AI.
            </p>
            <Link 
              href="/courses" 
              className="h-[46px] px-6 bg-brand-charcoal text-white font-bold text-sm inline-flex items-center justify-center hover:bg-brand-charcoal-hover transition-colors cursor-pointer select-none"
            >
              Browse Course Catalog
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
