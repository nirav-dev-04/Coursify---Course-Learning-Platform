'use client';

import React from 'react';
import Image from 'next/image';
import { Course } from '../lib/types';
import { PlayCircle, Loader2, Gift, Share2, Copy, Mail, X } from 'lucide-react';
import { getCourseThumbnail } from '../lib/utils/thumbnail';

interface BuySidebarCardProps {
  course: Course;
  fullWidth?: boolean;
  isEnrolled: boolean;
  isInCart?: boolean;
  purchaseType: 'subscribe' | 'buy';
  setPurchaseType: (type: 'subscribe' | 'buy') => void;
  handleCheckout: () => void;
  handleAddToCart: () => void;
  checkingOut: boolean;
  couponApplied: boolean;
  couponCode: string;
  setCouponCode: (code: string) => void;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  setIsShareModalOpen: (open: boolean) => void;
  displayRating: number;
  displayReviewCount: number;
  handleOpenPreview: () => void;
  user: any;
  router: any;
}

export default function BuySidebarCard({
  course,
  fullWidth = false,
  isEnrolled,
  isInCart = false,
  purchaseType,
  setPurchaseType,
  handleCheckout,
  handleAddToCart,
  checkingOut,
  couponApplied,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  setIsShareModalOpen,
  displayRating,
  displayReviewCount,
  handleOpenPreview,
  user,
  router,
}: BuySidebarCardProps) {
  return (
    <div className={`bg-white border border-brand-grey shadow-lg p-6 space-y-6 rounded-md ${fullWidth ? 'w-full' : 'w-[320px]'}`}>
      {/* Thematic Category Course Thumbnail with Play / Preview overlay trigger */}
      <div
        onClick={() => handleOpenPreview()}
        className="h-[160px] md:h-[200px] w-full relative overflow-hidden select-none cursor-pointer group/thumb rounded-[4px]"
      >
        <Image
          src={getCourseThumbnail(course.category, course.slug, course.title)}
          alt={course.title}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-1.5 group-hover/thumb:bg-black/45 transition-colors">
          <PlayCircle className="w-14 h-14 text-white drop-shadow-md group-hover/thumb:scale-110 transition-transform duration-200" />
          <span className="text-white text-[11px] font-bold bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 tracking-wide select-none">
            Preview this course
          </span>
        </div>
      </div>

      {/* Premium Udemy Style Dual Option Select Box */}
      {!isEnrolled && (
        <div className="border border-brand-grey rounded-md divide-y divide-brand-grey overflow-hidden select-none">
          {/* Option 1: Personal Subscription Plan */}
          <div
            onClick={() => setPurchaseType('subscribe')}
            className={`p-3.5 cursor-pointer transition-colors flex items-start gap-2.5 ${
              purchaseType === 'subscribe' ? 'bg-brand-bg/50 border-l-4 border-brand-purple' : 'hover:bg-brand-bg/20'
            }`}
          >
            <input
              type="radio"
              checked={purchaseType === 'subscribe'}
              readOnly
              className="accent-brand-purple mt-1 cursor-pointer"
            />
            <div className="text-xs">
              <p className="font-bold text-brand-charcoal">Subscribe and save</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Access to 20,000+ top-rated courses with Personal Plan.</p>
              <p className="font-bold text-brand-purple mt-2 text-[13px]">
                From ₹350.00 <span className="text-gray-400 font-normal text-[10px]">/ month</span>
              </p>
            </div>
          </div>

          {/* Option 2: Buy Individual Course */}
          <div
            onClick={() => setPurchaseType('buy')}
            className={`p-3.5 cursor-pointer transition-colors flex items-start gap-2.5 ${
              purchaseType === 'buy' ? 'bg-brand-bg/50 border-l-4 border-brand-purple' : 'hover:bg-brand-bg/20'
            }`}
          >
            <input
              type="radio"
              checked={purchaseType === 'buy'}
              readOnly
              className="accent-brand-purple mt-1 cursor-pointer"
            />
            <div className="text-xs w-full">
              <div className="flex items-center justify-between w-full">
                <p className="font-bold text-brand-charcoal">Buy individual course</p>
                {displayRating < 4.0 && (
                  <span className="text-[8px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 uppercase rounded tracking-wider select-none">
                    Super Discount
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Lifetime access. One-time purchase.</p>
              <div className="flex items-baseline gap-2 mt-2 w-full">
                <span className="font-bold text-lg text-brand-charcoal">
                  {course.price === 0
                    ? 'Free'
                    : couponApplied
                    ? `₹${(course.price * 0.9).toFixed(2)}`
                    : `₹${course.price.toFixed(2)}`}
                </span>
                {course.price > 0 && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{(course.price * (displayRating < 4.0 ? 5.5 : 2.5)).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {couponApplied ? '10% coupon applied!' : displayRating < 4.0 ? '82% off' : '60% off'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions button */}
      <div className="space-y-3">
        {isEnrolled ? (
          <button
            onClick={() => router.push(`/learn/${course.id}`)}
            className="h-[48px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none rounded-[4px] border-none"
          >
            Go to course player
          </button>
        ) : purchaseType === 'subscribe' ? (
          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="h-[48px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none disabled:bg-purple-300 rounded-[4px] border-none"
          >
            {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start subscription'}
          </button>
        ) : (
          <>
            {isInCart ? (
              <button
                onClick={() => router.push('/cart')}
                className="h-[48px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none rounded-[4px] border-none"
              >
                Go to Cart
              </button>
            ) : (
              <>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="h-[48px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none disabled:bg-purple-300 rounded-[4px] border-none"
                >
                  {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now'}
                </button>
                {course.price > 0 && (
                  <button
                    onClick={handleAddToCart}
                    className="h-[48px] w-full border border-brand-charcoal hover:bg-brand-bg text-brand-charcoal font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none rounded-[4px] bg-transparent"
                  >
                    Add to Cart
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Apply Coupon & Gift/Share Actions */}
      {!isEnrolled && (
        <div className="pt-4 border-t border-brand-grey space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-charcoal">Apply Coupon</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/login?redirect=/gift/${course.slug}`);
                  } else {
                    router.push(`/gift/${course.slug}`);
                  }
                }}
                className="text-brand-charcoal hover:text-brand-purple transition-colors p-1 border-none bg-transparent cursor-pointer"
                title="Gift this course"
              >
                <Gift className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="text-brand-charcoal hover:text-brand-purple transition-colors p-1 border-none bg-transparent cursor-pointer"
                title="Share this course"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="h-[40px] flex-grow border border-brand-charcoal px-3 text-xs font-medium focus:outline-none uppercase"
            />
            <button
              onClick={handleApplyCoupon}
              className="h-[40px] px-6 bg-brand-bg border border-brand-charcoal text-brand-charcoal hover:bg-brand-grey font-bold text-xs transition-colors cursor-pointer rounded-[4px]"
            >
              Apply
            </button>
          </div>

          {couponApplied && (
            <div className="flex justify-between items-center text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
              <span>
                <strong>KEEPLEARNING</strong> Applied!
              </span>
              <button
                onClick={handleRemoveCoupon}
                className="text-emerald-850 hover:text-emerald-950 font-bold border-none bg-transparent cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Value Props checklist */}
      <div className="space-y-2 text-xs text-brand-charcoal pt-4 border-t border-brand-grey select-none">
        <p className="font-bold">This course includes:</p>
        <ul className="space-y-2 text-gray-500 font-medium">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> 10-25 hours on-demand video
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Full lifetime access
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Access on mobile and TV
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Certificate of completion
          </li>
        </ul>
      </div>
    </div>
  );
}
