'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Course, Section, Lecture } from '../../../lib/types';
import { useAuth } from '../../../hooks/useAuth';
import { useCartStore } from '../../../store/useCartStore';
import BuySidebarCard from '../../../components/BuySidebarCard';
import { CourseDetailSkeleton } from '../../../components/skeletons';
import { Star, PlayCircle, Loader2, CheckCircle, Lock, ChevronDown, ChevronUp, Clock, FileText, Monitor, Award, Heart, Share2, HelpCircle, X, Gift, Copy, Mail } from 'lucide-react';
import { getCourseThumbnail } from '../../../lib/utils/thumbnail';
import VideoPlayer from '../../../components/VideoPlayer';
import Image from 'next/image';

function getWhatYouWillLearn(category: string, title: string): string[] {
  const titleLower = title.toLowerCase();
  if (category.toLowerCase().includes('software') || titleLower.includes('java') || titleLower.includes('programming') || titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('go')) {
    if (titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('frontend')) {
      return [
        'Build high-performance web applications using React 18 and Next.js App Router',
        'Configure scalable state management with Zustand, Redux Toolkit, and Context API',
        'Style interfaces using Tailwind CSS utilities and custom premium CSS designs',
        'Deploy production-ready frontend apps with SEO optimizations and static page generation'
      ];
    }
    if (titleLower.includes('java') || titleLower.includes('spring')) {
      return [
        'Master core Java syntax, OOP principles, multi-threading, and lambda expressions',
        'Build scalable RESTful microservices and enterprise backends using Spring Boot 3',
        'Optimize database queries with Hibernate ORM and PostgreSQL connection pooling',
        'Implement robust JWT authentication and secure APIs using Spring Security'
      ];
    }
    return [
      'Master industry best practices for backend API design and frontend integrations',
      'Optimize application speed and scale using Redis caching architectures',
      'Configure automated Docker container builds and Kubernetes cluster deployments',
      'Build a rich portfolio of complex projects to showcase to global tech recruiters'
    ];
  }
  if (category.toLowerCase().includes('ai') || category.toLowerCase().includes('data') || titleLower.includes('python') || titleLower.includes('learning')) {
    return [
      'Understand the mathematical foundations of Machine Learning and Deep Learning models',
      'Design, train, and validate neural networks using PyTorch, TensorFlow, and Scikit-Learn',
      'Fine-tune Large Language Models (LLMs) and build Generative AI RAG systems',
      'Clean complex data pipelines and build interactive BI reports using Python and Tableau'
    ];
  }
  if (category.toLowerCase().includes('finance') || category.toLowerCase().includes('trading') || titleLower.includes('market') || titleLower.includes('charts')) {
    return [
      'Perform chart technical analysis using candlestick patterns, moving averages, and indicators',
      'Backtest quantitative and algorithmic trading strategies using Python libraries',
      'Master stock options spread trading, risk mitigation, and capital allocation models',
      'Analyze forex trends, market microstructures, and decentralized order books'
    ];
  }
  return [
    'Gain concrete conceptual understanding of enterprise software design patterns',
    'Develop robust problem-solving skills utilizing data structures and algorithms',
    'Understand client-server architectures, RESTful API specs, and database designs',
    'Acquire certificate of completion and project source codes to highlight on resume'
  ];
}

function getRelatedTopics(category: string, title: string): string[] {
  const titleLower = title.toLowerCase();
  const topics = ['Development'];
  if (category.toLowerCase().includes('software')) {
    topics.push('Programming Languages');
    if (titleLower.includes('java')) topics.push('Java');
    else if (titleLower.includes('react') || titleLower.includes('next')) topics.push('React');
    else if (titleLower.includes('go')) topics.push('Go Programming');
    else topics.push('Web Development');
  } else if (category.toLowerCase().includes('ai') || category.toLowerCase().includes('data')) {
    topics.push('Data Science');
    if (titleLower.includes('python')) topics.push('Python');
    else if (titleLower.includes('pytorch') || titleLower.includes('deep')) topics.push('Deep Learning');
    else topics.push('Artificial Intelligence');
  } else if (category.toLowerCase().includes('finance') || category.toLowerCase().includes('trading')) {
    topics.push('Investing');
    if (titleLower.includes('options')) topics.push('Options Trading');
    else if (titleLower.includes('algo') || titleLower.includes('python')) topics.push('Algorithmic Trading');
    else topics.push('Stock Trading');
  } else {
    topics.push('Technology');
  }
  return topics;
}

const getMockSyllabus = (title: string) => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('java') || titleLower.includes('spring')) {
    return [
      {
        title: 'Introduction & Setup',
        lectures: [
          { title: 'Welcome & Curriculum Overview', duration: '6:12', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=1' },
          { title: 'Installing JDK 21 & IntelliJ IDEA', duration: '12:45', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=2' },
          { title: 'First Java Program: Hello World', duration: '8:30', isPreview: false }
        ]
      },
      {
        title: 'Object-Oriented Programming (OOP) in Java',
        lectures: [
          { title: 'Classes, Objects, and Instantiation', duration: '18:15', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=3' },
          { title: 'Inheritance, Polymorphism & Interfaces', duration: '22:40', isPreview: false },
          { title: 'Abstract Classes and Encapsulation', duration: '15:20', isPreview: false }
        ]
      },
      {
        title: 'Spring Boot Framework & REST APIs',
        lectures: [
          { title: 'Spring Dependency Injection Core concepts', duration: '20:10', isPreview: false },
          { title: 'Creating @RestController Endpoints', duration: '24:50', isPreview: false },
          { title: 'Data Persistence with Spring Data JPA', duration: '28:35', isPreview: false }
        ]
      }
    ];
  }
  if (titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('frontend')) {
    return [
      {
        title: 'Introduction to React & Next.js',
        lectures: [
          { title: 'Course Introduction & React basics', duration: '5:45', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=1' },
          { title: 'Understanding JSX & Component rendering', duration: '10:20', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=2' },
          { title: 'Vite vs Next.js: Choosing the right stack', duration: '8:55', isPreview: false }
        ]
      },
      {
        title: 'Next.js App Router & Layout System',
        lectures: [
          { title: 'File-based Routing & nested layouts', duration: '16:15', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=3' },
          { title: 'Server Components vs Client Components', duration: '22:30', isPreview: false },
          { title: 'Data Fetching, Caching & Revalidation', duration: '19:40', isPreview: false }
        ]
      },
      {
        title: 'Global State Management & Styling',
        lectures: [
          { title: 'Zustand: Simple state management', duration: '14:25', isPreview: false },
          { title: 'Tailwind CSS integration & utilities', duration: '12:10', isPreview: false }
        ]
      }
    ];
  }
  return [
    {
      title: 'Introduction & Setup',
      lectures: [
        { title: 'Welcome & Curriculum Overview', duration: '5:24', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=1' },
        { title: 'Local Development Environment Setup', duration: '12:15', isPreview: true, videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8?preview=2' }
      ]
    },
    {
      title: 'Core Architecture and Principles',
      lectures: [
        { title: 'Understanding Scalability Bottlenecks', duration: '18:40', isPreview: false },
        { title: 'Deep Dive: Redis Caching Strategies', duration: '22:10', isPreview: false }
      ]
    },
    {
      title: 'Deployment & Scaling',
      lectures: [
        { title: 'Dockerizing the application stack', duration: '15:30', isPreview: false },
        { title: 'Setting up CI/CD pipelines', duration: '19:45', isPreview: false }
      ]
    }
  ];
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;
  const { user } = useAuth();
  const { addToCart, items } = useCartStore();

  const [checkingOut, setCheckingOut] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'subscribe' | 'buy'>('buy');

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewTitle, setActivePreviewTitle] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'KEEPLEARNING') {
      setCouponApplied(true);
    } else if (couponCode.trim() !== '') {
      alert('Invalid coupon code. Try KEEPLEARNING');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPreview = (lectureUrl?: string, lectureTitle?: string) => {
    if (!course) return;
    const list = getMockSyllabus(course.title)
      .flatMap(s => s.lectures)
      .filter(l => l.isPreview);
    const defaultLecture = list[0];

    const targetUrl = lectureUrl || defaultLecture?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const targetTitle = lectureTitle || defaultLecture?.title || 'Course Preview';

    setActivePreviewUrl(targetUrl);
    setActivePreviewTitle(targetTitle);
    setIsPreviewModalOpen(true);
  };

  // 1. Fetch Course details
  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: ['courseDetail', slug],
    queryFn: async () => {
      const response = await api.get(`/courses/${slug}`);
      return response.data;
    }
  });

  // Fetch Course curriculum from database
  const { data: dbCurriculum } = useQuery<any[]>({
    queryKey: ['courseCurriculum', course?.id],
    queryFn: async () => {
      const response = await api.get(`/courses/${course?.id}/curriculum`);
      return response.data;
    },
    enabled: !!course?.id
  });

  // 2. Check Enrollment status if user logged in
  const { data: enrollmentData } = useQuery<{ isEnrolled: boolean }>({
    queryKey: ['checkEnrollment', course?.id],
    queryFn: async () => {
      const response = await api.get(`/enrollments/check/${course?.id}`);
      return response.data;
    },
    enabled: !!course && !!user
  });

  const isEnrolled = enrollmentData?.isEnrolled || course?.instructor?.id === user?.id || false;
  const isInCart = items.some(item => String(item.course.id) === String(course?.id));

  // 3. Fetch similar courses for recommendations
  const { data: similarCourses } = useQuery<Course[]>({
    queryKey: ['similarCoursesCatalog', course?.category, course?.id],
    queryFn: async () => {
      const response = await api.get('/courses', {
        params: { category: course?.category, limit: 3, exclude: course?.id }
      });
      return response.data;
    },
    enabled: !!course?.category
  });

  // Load Razorpay JS SDK dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAddToCart = async () => {
    if (!user) {
      // Save pending cart item so login page can auto-add it after authentication
      if (course) {
        const pendingData = { id: course.id, data: course };
        localStorage.setItem('pending_add_to_cart', JSON.stringify(pendingData));
      }
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (course) {
      await addToCart(course.id, course);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      // Save pending cart item so login page can auto-add it after authentication
      if (course) {
        const pendingData = { id: course.id, data: course };
        localStorage.setItem('pending_add_to_cart', JSON.stringify(pendingData));
      }
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (!course) return;

    const couponQuery = couponApplied ? '&coupon=KEEPLEARNING' : '';
    if (purchaseType === 'subscribe') {
      router.push(`/checkout?type=subscribe&courseId=${course.id}${couponQuery}`);
    } else {
      router.push(`/checkout?type=buy&courseId=${course.id}${couponQuery}`);
    }
  };


  if (loadingCourse || !course) {
    return <CourseDetailSkeleton />;
  }

  // Generate dynamic metadata
  const displayRating = Math.round((2.9 + (course.id % 22) * 0.1) * 10) / 10;
  const displayReviewCount = 85 + (course.id % 24) * 100 + (course.id % 9) * 12;

  const resolveVideoUrl = (videoKey?: string) => {
    if (!videoKey) return undefined;
    if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
      return videoKey;
    }
    return 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const mockSyllabus = dbCurriculum && dbCurriculum.length > 0
    ? dbCurriculum.map(s => ({
        title: s.title,
        lectures: s.lectures.map((l: any) => ({
          title: l.title,
          duration: formatDuration(l.durationSec),
          isPreview: l.isPreview,
          videoUrl: resolveVideoUrl(l.videoKey)
        }))
      }))
    : getMockSyllabus(course.title);

  const whatYouWillLearn = getWhatYouWillLearn(course.category, course.title);
  const relatedTopics = getRelatedTopics(course.category, course.title);
  const simHours = 10 + (course.id % 15);
  const totalLectures = mockSyllabus.reduce((acc, s) => acc + s.lectures.length, 0);

  // Filter similar courses
  const similarCoursesList = similarCourses || [];

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleExpandAll = () => {
    const expanded: Record<number, boolean> = {};
    mockSyllabus.forEach((_, idx) => {
      expanded[idx] = true;
    });
    setExpandedSections(expanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  return (
    <div className="flex-grow flex flex-col relative bg-white">

      {/* 1. Header Banner */}
      <section className="relative overflow-hidden bg-brand-charcoal py-16 px-4 md:px-12 text-white border-b border-brand-charcoal-hover">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={getCourseThumbnail(course.category, course.slug, course.title, 1280, 400)}
            alt={course.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70 md:bg-black/60 animate-in fade-in duration-300" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full md:pl-8 md:pr-[380px] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-cyan uppercase tracking-wider select-none">
            <span>Development</span>
            <span>➔</span>
            <span>{course.category}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight select-none">
            {course.title}
          </h1>
          <p className="text-base text-gray-300 leading-relaxed max-w-[650px]">
            {course.description}
          </p>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-brand-gold font-extrabold flex items-center gap-1 select-none">
              {displayRating.toFixed(1)} <Star className="w-4 h-4 fill-brand-gold text-brand-gold shrink-0" />
            </span>
            <span className="text-brand-purple font-bold border-b border-brand-purple leading-none cursor-pointer">
              {displayReviewCount.toLocaleString()} ratings
            </span>
            <span className="text-gray-400 font-medium">{displayReviewCount * 4} students</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300 font-medium">Created by <span className="font-bold text-white underline cursor-pointer">{course.instructor?.name}</span></span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold select-none pt-2">
            <span>Last updated 5/2026</span>
            <span>•</span>
            <span>English</span>
          </div>
        </div>
      </section>

      {/* 2. Main content area */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow flex flex-col md:flex-row gap-12">

        {/* Left Content column */}
        <div className="flex-grow md:max-w-[700px] space-y-8">

          {/* What you'll learn */}
          <div className="border border-brand-grey p-6 bg-brand-bg rounded-md">
            <h3 className="font-bold text-lg text-brand-charcoal mb-4">What you\'ll learn</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-brand-charcoal">
              {whatYouWillLearn.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4.5 h-4.5 text-brand-purple shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore related topics */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-brand-charcoal">Explore related topics</h3>
            <div className="flex flex-wrap gap-2.5">
              {relatedTopics.map((topic, idx) => (
                <Link
                  key={idx}
                  href={`/courses?q=${encodeURIComponent(topic)}`}
                  className="px-4 py-2 border border-brand-charcoal hover:bg-brand-bg rounded-full text-xs font-bold text-brand-charcoal transition-colors cursor-pointer select-none"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>

          {/* Coding Exercises Callout Box */}
          <div className="border border-brand-grey p-6 bg-white rounded-md flex flex-col md:flex-row items-center gap-6">
            <div className="space-y-3 flex-grow">
              <h4 className="font-extrabold text-lg text-brand-charcoal">Coding Exercises</h4>
              <p className="text-sm text-gray-600">
                This course includes our updated coding exercises so you can practice your skills as you learn.
              </p>
              <button className="text-brand-purple hover:text-brand-purple-hover text-xs font-bold underline border-none bg-transparent cursor-pointer">
                See a demo
              </button>
            </div>
            <div className="w-[180px] h-[110px] bg-brand-charcoal rounded flex items-center justify-center text-white text-[10px] border border-brand-charcoal-hover shrink-0 relative overflow-hidden select-none shadow">
              <div className="absolute top-0 left-0 right-0 bg-[#2d2d2d] px-2 py-1 flex items-center gap-1.5 border-b border-brand-charcoal-hover">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[7px] text-gray-400">Main.java</span>
              </div>
              <pre className="text-[7px] text-emerald-400 font-mono mt-4 text-left p-2">
                {`public class Main {
  public static void main(String[] args) {
    System.out.println("Coding Practice...");
  }
}`}
              </pre>
            </div>
          </div>

          {/* Curriculum Accordion */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-xl text-brand-charcoal">Course content</h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-brand-purple">
                <span className="text-gray-500">{mockSyllabus.length} sections • {totalLectures} lectures • {simHours}h total length</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleExpandAll} className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent">Expand all sections</button>
                  <span>|</span>
                  <button onClick={handleCollapseAll} className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent">Collapse all sections</button>
                </div>
              </div>
            </div>

            <div className="border border-brand-grey rounded divide-y divide-brand-grey shadow-sm overflow-hidden">
              {mockSyllabus.map((section, idx) => {
                const isOpen = expandedSections[idx] || false;
                return (
                  <div key={idx} className="bg-brand-bg">
                    {/* Section Title Accordion Toggle */}
                    <button
                      onClick={() => toggleSection(idx)}
                      className="w-full px-5 py-4 font-bold text-sm text-brand-charcoal flex justify-between items-center select-none cursor-pointer border-none bg-transparent text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        <span>{section.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium shrink-0">{section.lectures.length} lectures</span>
                    </button>

                    {/* Lectures list */}
                    {isOpen && (
                      <div className="bg-brand-white divide-y divide-brand-grey border-t border-brand-grey">
                        {section.lectures.map((lecture: any, lIdx: number) => (
                          <div key={lIdx} className="px-6 py-3.5 flex items-center justify-between text-sm text-brand-charcoal hover:bg-brand-bg transition-colors">
                            <div className="flex items-center gap-3">
                              {lecture.isPreview || isEnrolled ? (
                                <PlayCircle className="w-4.5 h-4.5 text-brand-purple shrink-0" />
                              ) : (
                                <Lock className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                              )}
                              <span
                                onClick={() => {
                                  if (lecture.isPreview && !isEnrolled) {
                                    handleOpenPreview(lecture.videoUrl, lecture.title);
                                  } else if (isEnrolled) {
                                    router.push(`/learn/${course.id}`);
                                  }
                                }}
                                className={lecture.isPreview || isEnrolled ? 'hover:text-brand-purple transition-colors cursor-pointer font-medium' : 'text-gray-500 font-medium'}
                              >
                                {lecture.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 select-none">
                              {lecture.isPreview && !isEnrolled && (
                                <span
                                  onClick={() => handleOpenPreview(lecture.videoUrl, lecture.title)}
                                  className="text-brand-purple font-bold border-b border-brand-purple leading-none cursor-pointer hover:text-brand-purple-hover"
                                >
                                  Preview
                                </span>
                              )}
                              <span>{lecture.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3 pt-4 border-t border-brand-grey">
            <h3 className="font-bold text-xl text-brand-charcoal">Requirements</h3>
            <ul className="list-disc pl-5 text-sm text-brand-charcoal space-y-2 leading-relaxed">
              <li>Basic familiarity with computer operations and coding logic concepts.</li>
              <li>A computer (Windows, macOS, or Linux) with an active internet connection.</li>
              <li>No paid developer tool subscriptions needed - all compilers, libraries, and IDE software are open-source.</li>
            </ul>
          </div>

          {/* Description Collapsible */}
          <div className="space-y-3 pt-6 border-t border-brand-grey">
            <h3 className="font-bold text-xl text-brand-charcoal">Description</h3>

            <div className="relative">
              <div className={`text-sm text-gray-600 leading-relaxed space-y-4 ${!isDescriptionExpanded ? 'max-h-[140px] overflow-hidden' : ''}`}>
                <p>{course.description}</p>
                <p>This premium course has been completely structured and designed to give you both deep conceptual insights and concrete practical fluency. We bypass slides and jump straight into write-back progress trackers, concurrent queues, multi-threaded pipelines, and clean architectures.</p>
                <p>By the end of this course, you will possess real-world software engineering confidence. You will have multiple fully functional repositories deployed, ready to showcase to recruiters and build projects that stand out.</p>
              </div>
              {!isDescriptionExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}

              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-brand-purple hover:text-brand-purple-hover font-bold text-xs flex items-center gap-1 mt-3 focus:outline-none bg-transparent border-none cursor-pointer"
              >
                {isDescriptionExpanded ? (
                  <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Show more <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>

          {/* Mobile buy card container (shown below description on mobile only) */}
          <div className="md:hidden w-full py-4 px-2">
            <BuySidebarCard
              course={course}
              fullWidth
              isEnrolled={isEnrolled}
              isInCart={isInCart}
              purchaseType={purchaseType}
              setPurchaseType={setPurchaseType}
              handleCheckout={handleCheckout}
              handleAddToCart={handleAddToCart}
              checkingOut={checkingOut}
              couponApplied={couponApplied}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
              handleRemoveCoupon={handleRemoveCoupon}
              setIsShareModalOpen={setIsShareModalOpen}
              displayRating={displayRating}
              displayReviewCount={displayReviewCount}
              handleOpenPreview={() => handleOpenPreview()}
              user={user}
              router={router}
            />
          </div>

          {/* Students Also Bought Similar recommendations list */}
          {similarCoursesList.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-brand-grey">
              <h3 className="font-bold text-xl text-brand-charcoal">Students also bought</h3>
              <div className="space-y-3.5 divide-y divide-brand-grey">
                {similarCoursesList.map((c, simIdx) => {
                  const simRating = Math.round((2.9 + (c.id % 22) * 0.1) * 10) / 10;
                  const simReviews = 85 + (c.id % 24) * 100 + (c.id % 9) * 12;
                  const simHours = 6 + (c.id % 12);
                  return (
                    <Link
                      key={c.id}
                      href={`/courses/${c.slug}`}
                      className="flex items-center gap-4 pt-3.5 first:pt-0 justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getCourseThumbnail(c.category, c.slug, c.title)}
                          alt={c.title}
                          className="w-[100px] h-[60px] object-cover rounded shrink-0 border border-brand-grey"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-brand-charcoal line-clamp-1 group-hover:text-brand-purple transition-colors">
                            {c.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap font-medium">
                            <span className="bg-purple-100 text-brand-purple font-extrabold text-[9px] px-1.5 py-0.5 rounded select-none">
                              Premium
                            </span>
                            <span className="text-brand-gold font-extrabold flex items-center gap-0.5 select-none">
                              {simRating.toFixed(1)} <Star className="w-3 h-3 fill-brand-gold text-brand-gold shrink-0" />
                            </span>
                            <span>({simReviews.toLocaleString()})</span>
                            <span>•</span>
                            <span>{simHours} hours</span>
                            <span>•</span>
                            <span>Updated 5/2026</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        {c.price > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{(c.price * (simRating < 4.0 ? 5.5 : 2.5)).toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold text-sm text-brand-charcoal">
                          {c.price === 0 ? 'Free' : `₹${c.price.toFixed(2)}`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar buy/subscription card */}
        <div className="hidden md:block w-full md:w-[320px] shrink-0">
          <div className="md:sticky md:top-24 z-20">
            <BuySidebarCard
              course={course}
              isEnrolled={isEnrolled}
              isInCart={isInCart}
              purchaseType={purchaseType}
              setPurchaseType={setPurchaseType}
              handleCheckout={handleCheckout}
              handleAddToCart={handleAddToCart}
              checkingOut={checkingOut}
              couponApplied={couponApplied}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
              handleRemoveCoupon={handleRemoveCoupon}
              setIsShareModalOpen={setIsShareModalOpen}
              displayRating={displayRating}
              displayReviewCount={displayReviewCount}
              handleOpenPreview={() => handleOpenPreview()}
              user={user}
              router={router}
            />
          </div>
        </div>
      </section>

      {/* 3. Course Preview Modal */}
      {isPreviewModalOpen && activePreviewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-4xl w-full overflow-hidden text-white flex flex-col md:flex-row h-[90vh] max-h-[580px] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

            {/* Modal close button */}
            <button
              onClick={() => {
                setIsPreviewModalOpen(false);
                setActivePreviewUrl(null);
                setActivePreviewTitle(null);
              }}
              className="absolute top-4 right-4 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full p-2 border border-zinc-800 transition-colors z-[60] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Content: Video Player */}
            <div className="flex-grow md:w-[60%] bg-black flex flex-col justify-center items-center relative h-[45%] md:h-full">
              <div className="absolute top-4 left-4 z-10 max-w-[80%] pointer-events-none select-none">
                <span className="text-[10px] uppercase tracking-wider text-brand-purple font-extrabold bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
                  Course Preview
                </span>
                <h4 className="text-sm font-bold text-white drop-shadow-md truncate mt-1.5">
                  {activePreviewTitle}
                </h4>
              </div>
              <div className="w-full h-full flex items-center justify-center">
                <VideoPlayer
                  key={activePreviewUrl}
                  src={activePreviewUrl}
                  onProgress={() => { }}
                />
              </div>
            </div>

            {/* Right Content: Sidebar Free Samples playlist */}
            <div className="w-full md:w-[40%] bg-zinc-900 flex flex-col h-[55%] md:h-full border-t md:border-t-0 md:border-l border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-300">Free Sample Videos</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{course.title}</p>
              </div>

              <div className="flex-grow overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1">
                {mockSyllabus
                  .flatMap((section: any) =>
                    section.lectures
                      .filter((l: any) => l.isPreview)
                      .map((l: any) => ({
                        ...l,
                        sectionTitle: section.title
                      }))
                  )
                  .map((lec, idx) => {
                    const isActive = activePreviewUrl === lec.videoUrl;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (lec.videoUrl) {
                            setActivePreviewUrl(lec.videoUrl);
                            setActivePreviewTitle(lec.title);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-md transition-all flex gap-3 items-center border-none ${isActive
                            ? 'bg-zinc-800 text-white font-bold border-l-4 border-brand-purple'
                            : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 bg-transparent'
                          }`}
                      >
                        {/* Play overlay thumbnail indicator */}
                        <div className="w-16 h-10 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                          <img
                            src={getCourseThumbnail(course.category, course.slug, course.title)}
                            alt=""
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <PlayCircle className={`w-5 h-5 ${isActive ? 'text-brand-purple' : 'text-white'}`} />
                          </div>
                        </div>

                        <div className="min-w-0 flex-grow text-[11px] leading-tight space-y-1">
                          <p className="font-semibold line-clamp-2">{lec.title}</p>
                          <p className="text-[9px] text-zinc-500">{lec.duration}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-brand-grey max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-brand-charcoal">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-brand-charcoal mb-4">Share this course</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  className="h-[40px] flex-grow border border-brand-charcoal px-3 text-xs bg-gray-50 text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="h-[40px] px-4 bg-[#A435F0] hover:bg-brand-purple-hover text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border-none"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2">
                <a
                  href={`mailto:?subject=Check out this course on EduFlow!&body=I highly recommend this course: ${course.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`}
                  className="h-[44px] w-full border border-brand-charcoal hover:bg-brand-bg text-brand-charcoal font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer no-underline rounded-[4px]"
                >
                  <Mail className="w-4 h-4 text-brand-charcoal" />
                  <span>Share via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
