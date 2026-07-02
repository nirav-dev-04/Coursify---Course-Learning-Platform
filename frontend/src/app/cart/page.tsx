'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Trash2, ShoppingBag, ArrowRight, Loader2, Star, StarHalf, Tag, Check } from 'lucide-react';
import { getCourseThumbnail } from '../../lib/utils/thumbnail';
import { useQuery } from '@tanstack/react-query';
import { Course } from '../../lib/types';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useSavedForLaterStore } from '../../store/useSavedForLaterStore';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, addToCart, removeFromCart, clearCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { items: savedItems, addToSaved, removeFromSaved } = useSavedForLaterStore();

  const [checkingOut, setCheckingOut] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [couponCode, setCouponCode] = useState('UDEAFFMX0626');
  const [isCouponApplied, setIsCouponApplied] = useState(true);
  const [couponInput, setCouponInput] = useState('');

  const handleSaveForLater = async (course: any) => {
    // Format instructor object similarly to CourseCard to store correctly
    const formattedCourse = {
      ...course,
      instructorName: course.instructor?.name || course.instructorName
    };
    addToSaved(formattedCourse);
    await removeFromCart(course.id);
  };

  const handleMoveToWishlist = async (course: any) => {
    const formattedCourse = {
      ...course,
      instructorName: course.instructor?.name || course.instructorName
    };
    addToWishlist(formattedCourse);
    await removeFromCart(course.id);
  };

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

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + item.course.price, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }
    router.push('/checkout?type=cart');
  };

  const subtotal = calculateSubtotal();
  const strikethroughTotal = items.reduce((acc, item) => {
    const rating = Math.round((2.9 + (item.course.id % 22) * 0.1) * 10) / 10;
    return acc + item.course.price * (rating < 4.0 ? 5.5 : 2.5);
  }, 0);
  const couponDiscount = isCouponApplied ? subtotal * 0.1 : 0;
  const finalTotal = subtotal - couponDiscount;
  const discountPercent = strikethroughTotal > 0 ? Math.round(((strikethroughTotal - finalTotal) / strikethroughTotal) * 100) : 0;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      setIsCouponApplied(true);
      setCouponCode(couponInput.trim().toUpperCase());
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setIsCouponApplied(false);
    setCouponCode('');
  };

  // Fetch recommended courses
  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ['cartRecommendations'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  const recommendedCourses = allCourses
    ?.filter(c => !items.some(item => item.course.id === c.id))
    .slice(0, 5) || [];

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow flex flex-col bg-white">
      <h1 className="text-3xl font-extrabold text-brand-charcoal mb-8">
        Shopping Cart
      </h1>

      {items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-12 flex-grow items-start">
          {/* Left: Cart Items List */}
          <div className="flex-grow space-y-6 w-full lg:max-w-[700px]">
            <p className="text-xs text-gray-500 font-bold uppercase select-none pb-2 border-b border-brand-grey">
              {items.length} Courses in Cart
            </p>

            <div className="divide-y divide-brand-grey border-b border-brand-grey">
              {items.map((item) => {
                const rating = Math.round((2.9 + (item.course.id % 22) * 0.1) * 10) / 10;
                const reviews = 85 + (item.course.id % 24) * 100 + (item.course.id % 9) * 12;
                const hours = 8 + (item.course.id % 12);
                const lectures = 20 + (item.course.id % 30);
                const level = item.course.id % 2 === 0 ? 'Beginner' : 'All Levels';
                const originalPrice = item.course.price * (rating < 4.0 ? 5.5 : 2.5);

                return (
                  <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-4 justify-between items-start">

                    {/* Thumbnail and Title */}
                    <div className="flex gap-4">
                      <div className="h-[75px] w-[120px] relative overflow-hidden select-none shrink-0 rounded border border-brand-grey">
                        <img
                          src={getCourseThumbnail(item.course.category, item.course.slug, item.course.title)}
                          alt={item.course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-brand-charcoal hover:text-brand-purple transition-colors cursor-pointer">
                          <Link href={`/courses/${item.course.slug}`}>
                            {item.course.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          By {item.course.instructor?.name || 'Instructor'}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 flex-wrap">
                          <span className="text-brand-gold font-extrabold flex items-center gap-0.5">
                            {rating.toFixed(1)} <Star className="w-3 h-3 fill-brand-gold text-brand-gold shrink-0" />
                          </span>
                          <span>({reviews.toLocaleString()} ratings)</span>
                          <span>•</span>
                          <span>{hours} total hours</span>
                          <span>•</span>
                          <span>{lectures} lectures</span>
                          <span>•</span>
                          <span>{level}</span>
                        </div>

                        {/* Inline Actions */}
                        <div className="flex gap-4 mt-3 select-none text-[11px] font-bold text-brand-purple">
                          <button
                            onClick={() => removeFromCart(item.course.id)}
                            className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent p-0"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => handleSaveForLater(item.course)}
                            className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent p-0"
                          >
                            Save for Later
                          </button>
                          <button
                            onClick={() => handleMoveToWishlist(item.course)}
                            className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent p-0"
                          >
                            Move to Wishlist
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Display */}
                    <div className="text-right shrink-0 flex flex-col items-end w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="font-bold text-base text-brand-charcoal">
                        {item.course.price === 0 ? 'Free' : `₹${item.course.price.toFixed(2)}`}
                      </span>
                      {item.course.price > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Summary panel */}
          <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24">
            <div className="border border-brand-grey bg-[#F7F9FA] p-6 space-y-6 rounded-md shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase select-none">Total Price:</p>
                <p className="text-3xl font-extrabold text-brand-charcoal">
                  ₹{finalTotal.toFixed(2)}
                </p>
                {finalTotal > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 select-none pt-1">
                    <span className="line-through">₹{strikethroughTotal.toFixed(2)}</span>
                    <span className="text-emerald-600 font-bold">{discountPercent}% off</span>
                  </div>
                )}
              </div>

              {/* Coupon Code section */}
              <div className="space-y-2 select-none border-t border-brand-grey pt-4">
                {isCouponApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <div>
                        <span className="font-bold">{couponCode}</span>
                        <span className="text-[10px] text-emerald-600 block">10% discount applied!</span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer border-none bg-transparent"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-grow h-[36px] px-3 border border-brand-charcoal text-xs font-medium focus:outline-none rounded-[4px]"
                    />
                    <button
                      type="submit"
                      className="h-[36px] px-4 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white text-xs font-bold transition-colors cursor-pointer rounded-[4px] border-none"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="h-[50px] w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:bg-purple-300 rounded-[4px]"
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-gray-500 text-center leading-relaxed">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy. All transactions are securely encrypted.
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty State Cart
        <div className="flex flex-col items-center w-full">
          <div className="py-20 text-center space-y-6 max-w-sm mx-auto">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-xl font-bold text-brand-charcoal">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500">
              Keep shopping to find the courses that will unlock your potential. Prices start as low as ₹399.00.
            </p>
            <Link
              href="/courses"
              className="h-[46px] px-6 bg-brand-purple text-white font-bold text-sm inline-flex items-center justify-center hover:bg-brand-purple-hover transition-colors cursor-pointer select-none rounded-[4px]"
            >
              Keep Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Render Saved for Later list */}
      {savedItems.length > 0 && (
        <div className="mt-12 border-t border-brand-grey pt-8 w-full lg:max-w-[700px]">
          <h2 className="text-xl font-bold text-brand-charcoal mb-6">
            Saved for later ({savedItems.length} {savedItems.length === 1 ? 'course' : 'courses'})
          </h2>
          <div className="divide-y divide-brand-grey border-b border-brand-grey">
            {savedItems.map((course) => {
              const rating = Math.round((2.9 + (course.id % 22) * 0.1) * 10) / 10;
              const reviews = 85 + (course.id % 24) * 100 + (course.id % 9) * 12;
              const hours = 8 + (course.id % 12);
              const lectures = 20 + (course.id % 30);
              const level = course.id % 2 === 0 ? 'Beginner' : 'All Levels';

              return (
                <div key={course.id} className="py-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-[75px] w-[120px] relative overflow-hidden select-none shrink-0 rounded border border-brand-grey">
                      <img
                        src={getCourseThumbnail(course.category, course.slug, course.title)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-brand-charcoal hover:text-brand-purple transition-colors cursor-pointer">
                        <Link href={`/courses/${course.slug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        By {course.instructorName || 'Instructor'}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 flex-wrap">
                        <span className="text-brand-gold font-extrabold flex items-center gap-0.5">
                          {rating.toFixed(1)} <Star className="w-3 h-3 fill-brand-gold text-brand-gold shrink-0" />
                        </span>
                        <span>({reviews.toLocaleString()} ratings)</span>
                        <span>•</span>
                        <span>{hours} total hours</span>
                        <span>•</span>
                        <span>{lectures} lectures</span>
                        <span>•</span>
                        <span>{level}</span>
                      </div>

                      <div className="flex gap-4 mt-3 select-none text-[11px] font-bold text-brand-purple">
                        <button
                          onClick={async () => {
                            const courseData = {
                              ...course,
                              instructor: {
                                name: course.instructorName
                              }
                            };
                            await addToCart(course.id, courseData);
                            removeFromSaved(course.id);
                          }}
                          className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent p-0"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => removeFromSaved(course.id)}
                          className="hover:text-brand-purple-hover cursor-pointer border-none bg-transparent p-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end w-full sm:w-auto mt-2 sm:mt-0">
                    <span className="font-bold text-base text-brand-charcoal">
                      {course.price === 0 ? 'Free' : `₹${course.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Courses Carousel (You might also like) */}
      {recommendedCourses.length > 0 && (
        <section className="mt-16 border-t border-brand-grey pt-12">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6">
            You might also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            {recommendedCourses.map((c) => {
              const rating = Math.round((2.9 + (c.id % 22) * 0.1) * 10) / 10;
              const reviews = 85 + (c.id % 24) * 100 + (c.id % 9) * 12;
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  className="group flex flex-col bg-white border border-brand-grey rounded overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="h-[100px] w-full overflow-hidden relative select-none">
                    <img
                      src={getCourseThumbnail(c.category, c.slug, c.title)}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-brand-charcoal line-clamp-2 leading-snug group-hover:text-brand-purple transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 truncate">
                        {c.instructor?.name || 'Instructor'}
                      </p>

                      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-500">
                        <span className="text-brand-gold font-bold">
                          {rating.toFixed(1)}
                        </span>
                        <div className="flex text-brand-gold">
                          <Star className="w-2.5 h-2.5 fill-current text-brand-gold" />
                        </div>
                        <span>({reviews.toLocaleString()})</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-brand-grey flex items-center justify-between">
                      <span className="text-[9px] font-bold text-brand-purple bg-purple-50 px-1.5 py-0.5 rounded uppercase">
                        Premium
                      </span>
                      <span className="font-bold text-xs text-brand-charcoal">
                        {c.price === 0 ? 'Free' : `₹${c.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
