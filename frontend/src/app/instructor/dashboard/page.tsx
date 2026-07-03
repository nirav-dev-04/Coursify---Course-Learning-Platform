'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { CourseListDTO } from '../../../lib/types';
import { 
  BookOpen, Users, Star, BarChart3, Loader2, ArrowRight, BookMarked, 
  MessageCircle, Send, Clock, Video, HelpCircle, Award, Compass, Heart
} from 'lucide-react';

export default function InstructorDashboard() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  
  const [courses, setCourses] = useState<CourseListDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Tabs: 'courses' | 'bundles' | 'cloning' | 'qa'
  const [activeTab, setActiveTab] = useState<'courses' | 'qa'>('courses');
  
  const [threads, setThreads] = useState<any[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);

  const fetchThreads = () => {
    setThreadsLoading(true);
    api.get('/discussions/instructor')
      .then(res => {
        setThreads(res.data || []);
      })
      .catch(err => {
        console.error('Failed to load discussions', err);
      })
      .finally(() => setThreadsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'qa') {
      fetchThreads();
    }
  }, [activeTab]);

  const handlePostReply = (threadId: number) => {
    if (!replyContent.trim()) return;
    setReplyingToId(threadId);
    api.post('/discussions/replies', { threadId, content: replyContent })
      .then(() => {
        setReplyContent('');
        api.get('/discussions/instructor')
          .then(res => {
            setThreads(res.data || []);
          });
      })
      .catch(err => {
        console.error('Failed to reply', err);
      })
      .finally(() => {
        setReplyingToId(null);
      });
  };

  useEffect(() => {
    if (!initialized) return;
    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      router.replace('/instructor');
      return;
    }
    api.get('/courses/instructor/me')
      .then(res => {
        setCourses(res.data || []);
      })
      .catch(err => {
        setErrorMsg('Failed to load courses.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, initialized, router]);

  const published = courses.filter(c => c.status === 'PUBLISHED').length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.title.length * 8 + (c.id % 7) * 23), 0);
  const totalEarnings = courses.reduce((sum, c) => sum + (c.price * (c.title.length * 8 + (c.id % 7) * 23) * 0.7), 0); // 70% share

  return (
    <main className="min-h-screen bg-white py-10 px-4 sm:px-6 md:px-8">
      <div className="max-w-[1140px] mx-auto space-y-8">
        
        {/* Title and Top Header */}
        <div className="flex items-center justify-between border-b border-brand-grey pb-4 select-none">
          <h1 className="text-3xl font-extrabold text-brand-charcoal tracking-tight">Courses</h1>
          {courses.length > 0 && (
            <Link 
              href="/instructor/courses/create"
              data-testid="create-course-top-btn"
              className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-5 h-[40px] flex items-center justify-center rounded-[4px] transition-colors shadow-sm cursor-pointer"
            >
              Create Your Course
            </Link>
          )}
        </div>

        {/* Tab Navigation - Horizontal scrolling on mobile */}
        <div className="border-b border-brand-grey overflow-x-auto select-none scrollbar-none flex">
          <div className="flex min-w-max space-x-6 text-xs font-bold text-brand-charcoal">
            <button
              onClick={() => setActiveTab('courses')}
              data-testid="tab-courses"
              className={`py-3 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
                activeTab === 'courses' 
                  ? 'text-brand-purple border-b-2 !border-brand-purple' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Courses
            </button>

            {/* Course Bundles - Disabled Coming Soon tab */}
            <div className="relative group flex items-center">
              <button
                type="button"
                data-testid="tab-course-bundles"
                className="py-3 text-gray-300 font-bold border-none bg-transparent cursor-not-allowed flex items-center gap-1.5"
              >
                Course bundles
                <span className="text-[9px] font-bold text-gray-400 bg-brand-bg px-1.5 py-0.5 rounded uppercase">Soon</span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-brand-charcoal text-white text-[10px] p-2 rounded-[4px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center">
                This feature is coming soon.
              </div>
            </div>

            {/* Course Cloning - Disabled Coming Soon tab */}
            <div className="relative group flex items-center">
              <button
                type="button"
                data-testid="tab-course-cloning"
                className="py-3 text-gray-300 font-bold border-none bg-transparent cursor-not-allowed flex items-center gap-1.5"
              >
                Course cloning
                <span className="text-[9px] font-bold text-gray-400 bg-brand-bg px-1.5 py-0.5 rounded uppercase">Soon</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-brand-charcoal text-white text-[10px] p-2 rounded-[4px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center">
                This feature is coming soon.
              </div>
            </div>

            <button
              onClick={() => setActiveTab('qa')}
              data-testid="tab-qa"
              className={`py-3 border-b-2 transition-all cursor-pointer bg-transparent border-none ${
                activeTab === 'qa' 
                  ? 'text-brand-purple border-b-2 !border-b-brand-purple' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Student Q&A {threads.length > 0 && `(${threads.length})`}
            </button>
          </div>
        </div>

        {/* 1. Loading Skeleton Fetch State */}
        {isLoading && (
          <div data-testid="dashboard-skeleton-loader" className="space-y-6">
            <div className="h-14 bg-gray-100 rounded-[4px] w-full animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 border border-brand-grey rounded-lg p-5 animate-pulse"></div>
              ))}
            </div>
            <div className="h-44 bg-gray-100 rounded-lg w-full animate-pulse"></div>
          </div>
        )}

        {/* Real Content Resolution */}
        {!isLoading && (
          <>
            {/* TAB: COURSES */}
            {activeTab === 'courses' && (
              <>
                {/* 2. Empty State View */}
                {courses.length === 0 ? (
                  <div className="space-y-12">
                    
                    {/* Banner CTA */}
                    <div 
                      data-testid="cta-create-course-banner" 
                      className="border border-brand-grey bg-white rounded-[4px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-5 text-left flex-col md:flex-row">
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
                          <CourseCreationIcon className="w-6 h-6 text-brand-purple" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-base sm:text-lg font-extrabold text-brand-charcoal">Jump Into Course Creation</h2>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">Ready to share your insights? Draft custom lectures and curriculum pipelines instantly.</p>
                        </div>
                      </div>
                      <Link
                        href="/instructor/courses/create"
                        className="w-full md:w-auto bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold px-6 h-[44px] sm:h-[48px] flex items-center justify-center rounded-[4px] transition-colors shrink-0"
                      >
                        Create Your Course
                      </Link>
                    </div>

                    {/* Resources section */}
                    <div className="space-y-6">
                      <p className="text-center text-xs text-gray-500 font-bold tracking-wide uppercase select-none">
                        Based on your experience, we think these resources will be helpful.
                      </p>

                      <div className="space-y-6">
                        {/* Resource Card 1 */}
                        <div 
                          data-testid="resource-card-engaging-course" 
                          className="border border-brand-grey bg-white rounded-[4px] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-10 hover:shadow-sm transition-all"
                        >
                          <div className="w-full md:w-[150px] flex justify-center shrink-0">
                            <EngagingCourseIllustration className="w-24 h-24 text-brand-purple" />
                          </div>
                          <div className="flex-grow space-y-3 text-left">
                            <h3 className="font-extrabold text-brand-charcoal text-base">Create an Engaging Course</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                              Whether you have been teaching for years or are teaching for the first time, you can design a compelling course. We have gathered resources, outlines, and structural checklists to help you build the best educational path.
                            </p>
                            <Link href="/help" className="inline-block text-xs font-extrabold text-brand-purple underline hover:text-brand-purple-hover">
                              Get Started
                            </Link>
                          </div>
                        </div>

                        {/* Resource Grid: Cards 2 & 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Card 2 */}
                          <div 
                            data-testid="resource-card-video"
                            className="border border-brand-grey bg-white rounded-[4px] p-6 flex flex-col sm:flex-row items-center gap-5 hover:shadow-sm transition-all"
                          >
                            <div className="w-[80px] flex justify-center shrink-0">
                              <VideoCameraIllustration className="w-16 h-16 text-brand-purple" />
                            </div>
                            <div className="flex-grow space-y-2 text-left">
                              <h3 className="font-extrabold text-brand-charcoal text-sm">Get Started with Video</h3>
                              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                                Quality video lectures set your curriculum apart. Learn the basics of screen recordings, camera setups, audio captures, and edits.
                              </p>
                              <Link href="/help" className="inline-block text-xs font-extrabold text-brand-purple underline hover:text-brand-purple-hover">
                                Get Started
                              </Link>
                            </div>
                          </div>

                          {/* Card 3 */}
                          <div 
                            data-testid="resource-card-audience"
                            className="border border-brand-grey bg-white rounded-[4px] p-6 flex flex-col sm:flex-row items-center gap-5 hover:shadow-sm transition-all"
                          >
                            <div className="w-[80px] flex justify-center shrink-0">
                              <AudienceIllustration className="w-16 h-16 text-brand-purple" />
                            </div>
                            <div className="flex-grow space-y-2 text-left">
                              <h3 className="font-extrabold text-brand-charcoal text-sm">Build Your Audience</h3>
                              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                                Set your course up for marketplace success. Gain visibility and students by organic search optimization, coupons, and discounts.
                              </p>
                              <Link href="/help" className="inline-block text-xs font-extrabold text-brand-purple underline hover:text-brand-purple-hover">
                                Get Started
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Resource Card 4 */}
                        <div 
                          data-testid="resource-card-challenge"
                          className="border border-brand-grey bg-white rounded-[4px] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-10 hover:shadow-sm transition-all"
                        >
                          <div className="w-full md:w-[150px] flex justify-center shrink-0">
                            <ChallengeIllustration className="w-24 h-24 text-brand-purple" />
                          </div>
                          <div className="flex-grow space-y-3 text-left">
                            <h3 className="font-extrabold text-brand-charcoal text-base">Join the New Instructor Challenge!</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                              Get exclusive tips and learning resources to launch your first draft faster. Instructors who publish their courses on time receive a badge and special search visibility boost. Start now!
                            </p>
                            <Link href="/help" className="inline-block text-xs font-extrabold text-brand-purple underline hover:text-brand-purple-hover">
                              Get Started
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Popular helper columns */}
                    <div className="space-y-6 select-none pt-4 border-t border-brand-grey">
                      <p className="text-center text-xs text-gray-500 font-bold tracking-wide uppercase">
                        Have questions? Here are our most popular instructor resources.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 text-center">
                        {[
                          { name: 'video', label: 'Test Video', icon: <Video className="w-5 h-5" />, desc: 'Send us a sample video and get expert feedback.' },
                          { name: 'community', label: 'Instructor Community', icon: <Users className="w-5 h-5" />, desc: 'Connect with experienced instructors, ask questions, and browse discussions.' },
                          { name: 'teaching', label: 'Teaching Center', icon: <BookOpen className="w-5 h-5" />, desc: 'Learn about best practices for planning, recording, and publishing courses.' },
                          { name: 'insights', label: 'Marketplace Insights', icon: <BarChart3 className="w-5 h-5" />, desc: 'Validate your course topic by exploring student demand and keyword trends.' },
                          { name: 'support', label: 'Help and Support', icon: <HelpCircle className="w-5 h-5" />, desc: 'Browse our Help Center or contact our dedicated customer support team.' }
                        ].map(col => (
                          <div 
                            key={col.name} 
                            data-testid={`helper-col-${col.name}`}
                            className="space-y-2 flex flex-col items-center"
                          >
                            <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center text-brand-purple">
                              {col.icon}
                            </div>
                            <h4 className="font-extrabold text-brand-charcoal text-xs">{col.label}</h4>
                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed max-w-[160px] mx-auto">{col.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="text-center space-y-4 py-8 border-t border-brand-grey">
                      <h2 className="text-xl font-extrabold text-brand-charcoal select-none">Are You Ready to Begin?</h2>
                      <div className="flex justify-center">
                        <Link 
                          href="/instructor/courses/create"
                          data-testid="cta-create-course-bottom"
                          className="w-full sm:w-auto px-10 h-[48px] bg-brand-purple hover:bg-brand-purple-hover text-white text-sm font-bold flex items-center justify-center rounded-[4px] transition-colors shadow-md"
                        >
                          Create Your Course
                        </Link>
                      </div>
                    </div>

                  </div>
                ) : (
                  // Active Inventory List
                  <div className="space-y-8">
                    {/* Performance widgets grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Courses', value: courses.length, icon: <BookOpen className="w-4 h-4 text-brand-purple" /> },
                        { label: 'Published Courses', value: published, icon: <BookMarked className="w-4 h-4 text-emerald-600" /> },
                        { label: 'Total Students', value: totalStudents.toLocaleString(), icon: <Users className="w-4 h-4 text-blue-600" /> },
                        { label: 'Est. Earnings', value: `₹${totalEarnings.toLocaleString()}`, icon: <Users className="w-4 h-4 text-amber-600" /> },
                      ].map((s, idx) => (
                        <div key={idx} className="bg-white border border-brand-grey rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                            <div className="p-1.5 bg-brand-bg rounded-md">{s.icon}</div>
                          </div>
                          <p className="text-2xl font-extrabold text-brand-charcoal mt-3">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart block */}
                    <div className="bg-white border border-brand-grey rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-brand-purple" /> Monthly Performance Analytics
                        </h2>
                        <span className="text-[10px] text-gray-400 font-semibold">Simulated analytics preview</span>
                      </div>
                      
                      <div className="h-44 w-full bg-brand-bg rounded-lg p-4 flex items-end justify-between gap-2 relative">
                        <div className="absolute top-2 left-4 text-[10px] text-gray-400 font-semibold">Estimated Monthly Earnings (INR)</div>
                        {[45000, 62000, 58000, 75000, 92000, Math.round(totalEarnings / 12 + 20000)].map((val, idx) => {
                          const heights = ['h-[25%]', 'h-[40%]', 'h-[35%]', 'h-[60%]', 'h-[80%]', 'h-[95%]'];
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                              <div className="text-[9px] md:text-[10px] font-bold text-brand-purple shrink-0">
                                ₹{val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                              </div>
                              <div className={`w-full ${heights[idx]} bg-brand-purple/20 hover:bg-brand-purple rounded-t transition-colors relative group`}>
                                <div className="absolute inset-0 bg-brand-purple rounded-t scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-200" />
                              </div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase">{months[idx]}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Course list table */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-brand-charcoal uppercase tracking-wider">Your Courses Inventory</h2>
                        <span className="text-xs text-gray-500 font-semibold">{courses.length} courses total</span>
                      </div>

                      {errorMsg && <p className="text-red-500 text-xs font-bold">{errorMsg}</p>}

                      <div className="grid grid-cols-1 gap-3">
                        {courses.map(course => (
                          <div 
                            key={course.id} 
                            data-testid={`course-row-${course.id}`}
                            className="bg-white border border-brand-grey rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-1 max-w-xl">
                              <h3 className="font-extrabold text-sm text-brand-charcoal leading-snug hover:text-brand-purple transition-colors">
                                {course.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                <span className="bg-brand-bg px-2.5 py-0.5 rounded text-gray-500 font-semibold">{course.category}</span>
                                <span>·</span>
                                <span className="font-bold text-brand-charcoal">
                                  {course.price === 0 ? 'Free' : `₹${course.price}`}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5 text-brand-gold font-bold">
                                  ★ {course.avgRating ? course.avgRating.toFixed(1) : '0.0'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                              <span className={`text-[10px] font-extrabold px-3 py-1 rounded tracking-wider uppercase ${
                                course.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {course.status}
                              </span>
                              
                              <Link 
                                href={`/learn/${course.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                              >
                                Course Player <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
          
                              <Link 
                                href={`/instructor/courses/${course.id}/edit`}
                                className="inline-flex items-center gap-1.5 text-xs text-brand-purple hover:text-brand-purple-hover font-bold hover:underline"
                              >
                                Manage Course <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: STUDENT Q&A */}
            {activeTab === 'qa' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-brand-charcoal uppercase tracking-wider">Student Discussions</h2>
                  <span className="text-xs text-gray-500 font-semibold">{threads.length} questions total</span>
                </div>

                {threadsLoading ? (
                  <div className="bg-white border border-brand-grey rounded-lg p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                  </div>
                ) : threads.length === 0 ? (
                  /* Clean empty state for student threads */
                  <div 
                    data-testid="qa-empty-state" 
                    className="py-16 text-center space-y-4 border border-brand-grey bg-white rounded-lg"
                  >
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-brand-purple">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-brand-charcoal">No questions yet</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed font-semibold">
                        Once students start your course, their questions and discussions will show up here for you to respond.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {threads.map(thread => (
                      <div 
                        key={thread.id} 
                        className="bg-white border border-brand-grey rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setExpandedThreadId(expandedThreadId === thread.id ? null : thread.id)}
                          className="w-full text-left p-5 hover:bg-brand-bg transition-colors cursor-pointer bg-transparent border-none block"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 text-brand-purple text-xs font-extrabold">
                              {thread.authorName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-grow min-w-0 space-y-1">
                              <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 flex-wrap">
                                <span className="text-brand-charcoal font-extrabold text-sm">{thread.authorName}</span>
                                <span>asked in</span>
                                <span className="text-brand-purple font-semibold">{thread.courseTitle}</span>
                                <span>•</span>
                                <span className="text-gray-500">{thread.lectureTitle || 'General'}</span>
                              </div>
                              <h3 className="font-extrabold text-sm text-brand-charcoal pt-0.5 leading-snug">{thread.title}</h3>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold pt-1">
                                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {new Date(thread.createdAt).toLocaleDateString()}</span>
                                {thread.videoTimestamp > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-brand-purple">Video timestamp: {Math.floor(thread.videoTimestamp / 60)}:{(thread.videoTimestamp % 60).toString().padStart(2, '0')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-brand-bg px-2.5 py-1 rounded shrink-0">
                              {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                          </div>
                        </button>

                        {expandedThreadId === thread.id && (
                          <div className="px-5 pb-5 space-y-4 border-t border-brand-grey pt-4 bg-brand-bg/25">
                            <div className="bg-white p-4 rounded border border-brand-grey">
                              <p className="text-xs text-brand-charcoal font-medium whitespace-pre-wrap leading-relaxed">
                                {thread.content}
                              </p>
                            </div>

                            {/* Replies */}
                            {thread.replies && thread.replies.length > 0 && (
                              <div className="space-y-3 pl-4 border-l-2 border-brand-purple/20">
                                {thread.replies.map((reply: any) => (
                                  <div key={reply.id} className="bg-white p-3 rounded border border-brand-grey space-y-1">
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                                      <span className="font-extrabold text-brand-charcoal">{reply.authorName}</span>
                                      <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply form */}
                            <div className="flex gap-2 pt-2">
                              <input
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handlePostReply(thread.id);
                                  }
                                }}
                                placeholder="Type your reply as instructor..."
                                className="flex-grow bg-white text-brand-charcoal text-xs font-medium px-3.5 py-2.5 rounded border border-brand-grey outline-none focus:border-brand-purple placeholder:text-gray-400 shadow-sm"
                              />
                              <button
                                onClick={() => handlePostReply(thread.id)}
                                disabled={replyingToId === thread.id || !replyContent.trim()}
                                className="bg-brand-purple hover:bg-brand-purple-hover text-white px-4 py-2.5 rounded transition-colors cursor-pointer border-none flex items-center justify-center disabled:opacity-50 shadow-sm"
                              >
                                {replyingToId === thread.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

// Iconography Guidelines:
// - Stroke-width 2px
// - Stroke-linecap round, stroke-linejoin round
// - Brand purple #A435F0 as accent
// - Secondary charcoal/gray lines

function CourseCreationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" className="text-brand-purple" stroke="currentColor" fill="none" />
    </svg>
  );
}

function EngagingCourseIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="40" fill="#F4E8FC" stroke="none" />
      {/* Computer display */}
      <rect x="22" y="25" width="56" height="38" rx="3" stroke="#2D2F31" />
      <line x1="38" y1="63" x2="30" y2="75" stroke="#2D2F31" />
      <line x1="62" y1="63" x2="70" y2="75" stroke="#2D2F31" />
      <line x1="30" y1="75" x2="70" y2="75" stroke="#2D2F31" />
      {/* Graphical elements representing chart/content inside */}
      <path d="M30 48v-8M42 48V34" stroke="#2D2F31" />
      <path d="M54 48V38" stroke="#A435F0" className="text-brand-purple" />
      <path d="M66 48V30" stroke="#A435F0" className="text-brand-purple" />
      <line x1="22" y1="52" x2="78" y2="52" stroke="#2D2F31" />
    </svg>
  );
}

function VideoCameraIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="50" cy="50" r="40" fill="#F4E8FC" stroke="none" />
      {/* Camera Body */}
      <rect x="26" y="32" width="34" height="24" rx="2" stroke="#2D2F31" />
      {/* Camera Lens mount */}
      <path d="M60 40l14-8v16l-14-8Z" stroke="#A435F0" className="text-brand-purple" fill="#A435F0" fillOpacity="0.1" />
      {/* Tripod Stand */}
      <line x1="43" y1="56" x2="35" y2="72" stroke="#2D2F31" />
      <line x1="43" y1="56" x2="51" y2="72" stroke="#2D2F31" />
      {/* Recording Light dot */}
      <circle cx="34" cy="38" r="2" fill="#A435F0" stroke="none" />
    </svg>
  );
}

function AudienceIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="50" cy="50" r="40" fill="#F4E8FC" stroke="none" />
      {/* Tablet Screen */}
      <rect x="30" y="24" width="40" height="52" rx="3" stroke="#2D2F31" />
      <circle cx="50" cy="70" r="2" fill="#2D2F31" />
      {/* Profile/Users network vectors */}
      <circle cx="50" cy="42" r="6" stroke="#A435F0" className="text-brand-purple" />
      <path d="M40 54c0-4 4-6 10-6s10 2 10 6" stroke="#A435F0" className="text-brand-purple" />
      <line x1="36" y1="36" x2="42" y2="40" stroke="#2D2F31" />
      <line x1="64" y1="36" x2="58" y2="40" stroke="#2D2F31" />
    </svg>
  );
}

function ChallengeIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="50" cy="50" r="40" fill="#F4E8FC" stroke="none" />
      {/* Trophy Outline */}
      <path d="M34 30h32v18c0 8.8-7.2 16-16 16s-16-7.2-16-16V30Z" stroke="#2D2F31" />
      <path d="M50 64v12M40 76h20" stroke="#2D2F31" />
      {/* Handles */}
      <path d="M34 36H28v10c0 3 3 5 6 5M66 36h6v10c0 3-3 5-6 5" stroke="#2D2F31" />
      {/* Accent Star inside */}
      <path d="M50 38l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" stroke="#A435F0" className="text-brand-purple" fill="#A435F0" />
    </svg>
  );
}
