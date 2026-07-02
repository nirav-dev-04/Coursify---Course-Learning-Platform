'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { CourseListDTO } from '../lib/types';
import { Star, StarHalf, Check, Heart, Loader2 } from 'lucide-react';
import { getCourseThumbnail } from '../lib/utils/thumbnail';
import { useCartStore } from '../store/useCartStore';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '../store/useWishlistStore';

interface CourseCardProps {
  course: CourseListDTO;
}

function getCourseObjectives(category: string, title: string): string[] {
  const titleLower = title.toLowerCase();
  if (category.toLowerCase().includes('software') || titleLower.includes('java') || titleLower.includes('programming') || titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('go')) {
    if (titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('frontend')) {
      return [
        'Build high-performance web applications using React 18 and Next.js App Router',
        'Configure scalable state management with Zustand, Redux Toolkit, and Context API',
        'Style interfaces using Tailwind CSS utilities and custom premium designs'
      ];
    }
    if (titleLower.includes('java') || titleLower.includes('spring')) {
      return [
        'Master core Java syntax, OOP principles, multi-threading, and lambda expressions',
        'Build scalable RESTful microservices and enterprise backends using Spring Boot 3',
        'Optimize database queries with Hibernate ORM and PostgreSQL connection pooling'
      ];
    }
    return [
      'Master industry best practices for backend API design and frontend integrations',
      'Optimize application speed and scale using Redis caching architectures',
      'Configure automated Docker container builds and Kubernetes deployments'
    ];
  }
  if (category.toLowerCase().includes('ai') || category.toLowerCase().includes('data') || titleLower.includes('python') || titleLower.includes('learning')) {
    return [
      'Understand mathematical foundations of Machine Learning and Deep Learning models',
      'Design, train, and validate neural networks using PyTorch and TensorFlow',
      'Fine-tune Large Language Models (LLMs) and build Generative AI RAG systems'
    ];
  }
  if (category.toLowerCase().includes('finance') || category.toLowerCase().includes('trading') || titleLower.includes('market') || titleLower.includes('charts')) {
    return [
      'Perform chart technical analysis using candlestick patterns and indicators',
      'Backtest quantitative and algorithmic trading strategies using Python',
      'Master stock options spread trading and risk mitigation models'
    ];
  }
  return [
    'Gain concrete conceptual understanding of enterprise software design patterns',
    'Develop robust problem-solving skills utilizing data structures and algorithms',
    'Understand client-server architectures, RESTful API specs, and database designs'
  ];
}

function getCourseHeadline(category: string, title: string): string {
  const titleLower = title.toLowerCase();
  if (category.toLowerCase().includes('software') || titleLower.includes('java') || titleLower.includes('programming') || titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('go')) {
    if (titleLower.includes('react') || titleLower.includes('next') || titleLower.includes('frontend')) {
      return 'Build high-performance web applications using React 18, Next.js App Router, and TypeScript.';
    }
    if (titleLower.includes('java') || titleLower.includes('spring')) {
      return 'Master core Java syntax, OOP principles, multi-threading, Spring Boot 3, and build production REST APIs.';
    }
    return 'Learn industry best practices for backend API design, frontend integrations, and deployment pipelines.';
  }
  if (category.toLowerCase().includes('ai') || category.toLowerCase().includes('data') || titleLower.includes('python') || titleLower.includes('learning')) {
    return 'Master mathematical foundations of Machine Learning, neural networks, PyTorch, and Generative AI RAG pipelines.';
  }
  if (category.toLowerCase().includes('finance') || category.toLowerCase().includes('trading') || titleLower.includes('market') || titleLower.includes('charts')) {
    return 'Understand technical analysis, stock options spreads, algorithmic trading models, and risk management strategies.';
  }
  return 'Gain concrete conceptual understanding of enterprise software design patterns, APIs, and modern system architectures.';
}

export default function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, addToCart } = useCartStore();

  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'left' | 'right'>('right');
  const [addingToCartState, setAddingToCartState] = useState(false);
  const [isHoverDevice, setIsHoverDevice] = useState(false);

  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(course.id);

  const cardRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsHoverDevice(window.matchMedia('(hover: hover)').matches);
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isHoverDevice) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const cardMid = rect.left + rect.width / 2;
      if (cardMid > windowWidth / 2) {
        setPopoverPosition('left');
      } else {
        setPopoverPosition('right');
      }
    }

    if (!showPopover && !enterTimerRef.current) {
      enterTimerRef.current = setTimeout(() => {
        setShowPopover(true);
        enterTimerRef.current = null;
      }, 400);
    }
  };

  const handleMouseLeave = () => {
    if (!isHoverDevice) return;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    if (!leaveTimerRef.current) {
      leaveTimerRef.current = setTimeout(() => {
        setShowPopover(false);
        leaveTimerRef.current = null;
      }, 200);
    }
  };

  const handleMouseEnterPopover = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleMouseLeavePopover = () => {
    handleMouseLeave();
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?redirect=/courses/${course.slug}`);
      return;
    }

    setAddingToCartState(true);
    try {
      const courseData = {
        ...course,
        instructor: {
          name: course.instructorName
        }
      };
      await addToCart(course.id, courseData);
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setAddingToCartState(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?redirect=/courses/${course.slug}`);
      return;
    }
    toggleWishlist(course);
  };
  
  // Generate a realistic rating between 2.9 and 5.0 based on the course ID
  const displayRating = (!course.avgRating || course.avgRating === 0) ? Math.round((2.9 + (course.id % 22) * 0.1) * 10) / 10 : course.avgRating;
  // Generate a realistic review count between 80 and 2500
  const displayReviewCount = (!course.avgRating || course.avgRating === 0) ? (85 + (course.id % 24) * 100 + (course.id % 9) * 12) : 15;

  const isInCart = items.some(item => item.course.id === course.id);
  const simHours = 8 + (course.id % 12);
  const derivedLevel = course.id % 2 === 0 ? 'Beginner' : 'All Levels';
  
  let level = 'All Levels';
  const titleLower = course.title.toLowerCase();
  if (titleLower.includes('mastery') || titleLower.includes('masterclass') || titleLower.includes('advanced') || titleLower.includes('deep dive') || titleLower.includes('expert')) {
    level = 'Expert Level';
  } else if (titleLower.includes('beginner') || titleLower.includes('basics') || titleLower.includes('introduction') || titleLower.includes('absolute')) {
    level = 'Beginner Level';
  } else if (titleLower.includes('complete') || titleLower.includes('bootcamp') || titleLower.includes('guide') || titleLower.includes('developer')) {
    level = 'Intermediate Level';
  } else {
    level = derivedLevel + ' Level';
  }

  // Render stars based on decimal rating (e.g. 4.5)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 <= 0.75;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-[12px] h-[12px] fill-[#b4690e] text-[#b4690e] shrink-0" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} className="w-[12px] h-[12px] fill-[#b4690e] text-[#b4690e] shrink-0" />);
      } else {
        stars.push(<Star key={i} className="w-[12px] h-[12px] text-gray-300 shrink-0" />);
      }
    }
    return stars;
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group/card z-10 hover:z-20 h-full flex flex-col bg-transparent transition-all duration-200"
    >
      <Link href={`/courses/${course.slug}`} className="group flex flex-col h-full flex-grow">
        
        {/* 1. Category-Themed Stock Thumbnail */}
        <div className="w-full aspect-[16/10] overflow-hidden rounded-[4px] mb-2 relative select-none">
          <Image 
            src={getCourseThumbnail(course.category, course.slug, course.title)} 
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Soft overlay */}
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* 2. Course Meta Content */}
        <div className="flex-grow flex flex-col justify-between">
          <div>
            {/* Title */}
            <h3 className="font-bold text-sm text-[#1c1d1f] leading-snug line-clamp-2 mb-0.5 group-hover:text-brand-purple transition-colors">
              {course.title}
            </h3>
            
            {/* Instructor */}
            <p className="text-[11px] text-[#6a6f73] mb-1 truncate">
              {course.instructorName}
            </p>

            {/* Rating row matching specification */}
            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-[#b4690e]">{displayRating.toFixed(1)}</span>
              <div className="flex items-center gap-0.5 select-none">
                {renderStars(displayRating)}
              </div>
              <span className="text-[10px] text-[#6a6f73]">({displayReviewCount.toLocaleString()})</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-1 shrink-0 flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-extrabold text-base text-[#1c1d1f]">
                {course.price === 0 ? 'Free' : `₹${course.price.toFixed(2)}`}
              </span>
              {course.price > 0 && (
                <span className="text-xs text-[#6a6f73] line-through font-medium">
                  ₹{(course.price * (displayRating < 4.0 ? 5.5 : 2.5)).toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {course.id % 3 === 0 && (
                <span className="text-[9px] font-extrabold text-[#1c1d1f] bg-[#eceb98] px-2 py-0.5 rounded-sm select-none">
                  Bestseller
                </span>
              )}
              {displayRating < 4.0 && (
                <span className="text-[9px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 uppercase rounded tracking-wider select-none">
                  Super Discount
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Hover Popover Details Card */}
      {showPopover && (
        <div 
          onMouseEnter={handleMouseEnterPopover}
          onMouseLeave={handleMouseLeavePopover}
          className={`absolute top-[-20px] ${
            popoverPosition === 'right' 
              ? 'left-full ml-4' 
              : 'right-full mr-4'
          } w-[340px] bg-white border border-brand-grey shadow-2xl p-5 text-brand-charcoal text-left z-50 rounded select-none cursor-default`}
        >
          {/* Transparent bridge to prevent hover loss */}
          <div 
            className={`absolute top-0 bottom-0 ${
              popoverPosition === 'right' 
                ? '-left-4 w-4' 
                : '-right-4 w-4'
            } bg-transparent`} 
          />
          
          <h4 className="font-bold text-base text-brand-charcoal line-clamp-2 leading-snug mb-1">
            {course.title}
          </h4>
          
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2 font-medium">
            <span className="bg-purple-100 text-brand-purple font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
              Premium
            </span>
            {course.id % 3 === 0 && (
              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                Bestseller
              </span>
            )}
            <span className="text-gray-400">Updated June 2026</span>
          </div>

          <p className="text-[11px] text-gray-400 font-semibold mb-2">
            {simHours} total hours • {level} • Subtitles
          </p>

          <p className="text-xs text-gray-600 mb-3.5 leading-relaxed font-medium">
            {getCourseHeadline(course.category, course.title)}
          </p>

          <div className="space-y-2 mb-4">
            {getCourseObjectives(course.category, course.title).map((obj, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-gray-600 leading-tight">
                <Check className="w-3.5 h-3.5 text-brand-charcoal shrink-0 mt-0.5" />
                <span>{obj}</span>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-3 border-t border-brand-grey shrink-0">
            {isInCart ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/cart');
                }}
                className="flex-grow h-[40px] bg-brand-purple hover:bg-brand-purple-hover text-white font-extrabold text-xs flex items-center justify-center transition-colors cursor-pointer border-none rounded-[4px]"
              >
                Go to Cart
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addingToCartState}
                className="flex-grow h-[40px] bg-brand-purple hover:bg-brand-purple-hover text-white font-extrabold text-xs flex items-center justify-center transition-colors cursor-pointer border-none rounded-[4px] disabled:bg-purple-300"
              >
                {addingToCartState ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Add to Cart'}
              </button>
            )}
            <button
              onClick={handleWishlistToggle}
              className={`w-[40px] h-[40px] border border-brand-charcoal rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-brand-bg shrink-0 bg-transparent ${isWishlisted ? 'border-red-500 hover:bg-red-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-brand-charcoal'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

