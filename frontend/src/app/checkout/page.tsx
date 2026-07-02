'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { CourseListDTO } from '../../lib/types';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../hooks/useAuth';
import { Globe, CreditCard, Lock, Check, ArrowLeft, Loader2, Star, ChevronDown, Gift } from 'lucide-react';
import { getCourseThumbnail } from '../../lib/utils/thumbnail';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const type = searchParams.get('type') || 'buy';
  const courseId = searchParams.get('courseId');
  const recipientName = searchParams.get('recipientName') || '';
  const recipientEmail = searchParams.get('recipientEmail') || '';
  const deliveryDate = searchParams.get('deliveryDate') || '';
  const message = searchParams.get('message') || '';
  const urlCoupon = searchParams.get('coupon') || '';

  const { items: cartItems, addToCart, clearCart } = useCartStore();
  
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Checkout Options
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<'yearly' | 'monthly'>('yearly');
  const [billingCountry, setBillingCountry] = useState('India');
  const [billingState, setBillingState] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');

  // Coupon State
  const [couponCode, setCouponCode] = useState(urlCoupon);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    code?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    newTotal?: number;
    message?: string;
  } | null>(null);

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

  // Fetch course detail if single checkout or subscription
  const { data: allCourses, isLoading: loadingCourses } = useQuery<CourseListDTO[]>({
    queryKey: ['checkoutCoursesList'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  const activeCourse = allCourses?.find(c => String(c.id) === String(courseId));

  // If type is 'buy', automatically ensure the course is in the cart
  useEffect(() => {
    if ((type === 'buy' || type === 'gift') && activeCourse) {
      const isAlreadyInCart = cartItems.some(item => String(item.course.id) === String(activeCourse.id));
      if (!isAlreadyInCart) {
        addToCart(activeCourse.id, activeCourse);
      }
    }
  }, [type, activeCourse, cartItems, addToCart]);

  // Auto-validate URL coupon on mount
  useEffect(() => {
    if (urlCoupon && activeCourse) {
      handleValidateCoupon(urlCoupon);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCoupon, activeCourse]);

  // Loading state
  const isLoading = loadingCourses || (!activeCourse && !!courseId);

  // Coupon validation handler
  const handleValidateCoupon = async (codeOverride?: string) => {
    const codeToValidate = codeOverride || couponCode;
    if (!codeToValidate || codeToValidate.trim() === '') {
      setCouponResult({ valid: false, message: 'Please enter a coupon code.' });
      return;
    }
    setCouponLoading(true);
    try {
      const subtotal = type === 'gift' && activeCourse
        ? activeCourse.price
        : type === 'subscribe'
        ? (subscriptionPeriod === 'yearly' ? 6000 : 780)
        : cartItems.reduce((acc, item) => acc + item.course.price, 0);
      
      const response = await api.get('/coupons/validate', {
        params: {
          code: codeToValidate.trim(),
          subtotal,
          courseId: activeCourse?.id || undefined
        }
      });
      setCouponResult(response.data);
    } catch {
      setCouponResult({ valid: false, message: 'Failed to validate coupon. Please try again.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
  };

  // Computations
  const getTotals = () => {
    if (type === 'subscribe') {
      const amount = subscriptionPeriod === 'yearly' ? 6000 : 780;
      const discount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0;
      return {
        subtotal: amount,
        discount,
        total: Math.max(amount - discount, 0),
        periodText: subscriptionPeriod === 'yearly' ? '/year' : '/month'
      };
    }
    
    if (type === 'cart' || type === 'buy' || type === 'gift') {
      const subtotal = type === 'gift' && activeCourse 
        ? activeCourse.price 
        : cartItems.reduce((acc, item) => acc + item.course.price, 0);
      const discount = couponResult?.valid ? (couponResult.discountAmount || 0) : 0;
      return {
        subtotal,
        discount,
        total: Math.max(subtotal - discount, 0),
        periodText: ''
      };
    }

    return { subtotal: 0, discount: 0, total: 0, periodText: '' };
  };

  const totals = getTotals();

  // Execute Razorpay order checkout
  const handlePayment = async () => {
    if (!user) {
      router.push(`/login?redirect=/checkout?type=${type}&courseId=${courseId}`);
      return;
    }

    if (!razorpayLoaded) {
      alert('Payment gateway is loading... Please try again in a few seconds.');
      return;
    }

    if (!billingState) {
      alert('Please select your State / Union Territory to continue.');
      return;
    }

    setCheckingOut(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      // Step 1: Create Order on Backend
      let payload: any = { 
        idempotencyKey,
        paymentMethod: paymentMethod.toUpperCase()
      };

      if (type === 'subscribe') {
        payload.isSubscription = true;
        payload.courseId = activeCourse?.id;
        payload.subscriptionPeriod = subscriptionPeriod;
      } else if (type === 'gift') {
        payload.isGift = true;
        payload.courseId = activeCourse?.id;
        payload.recipientName = recipientName;
        payload.recipientEmail = recipientEmail;
        payload.deliveryDate = deliveryDate;
        payload.giftMessage = message;
      }

      // Attach coupon code if validated
      if (couponResult?.valid && couponCode) {
        payload.couponCode = couponCode.trim();
      }

      const orderResponse = await api.post('/orders/checkout', payload);
      const { razorpayOrderId, amount, currency, razorpayKeyId } = orderResponse.data;

      // Step 2: Launch Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'EduFlow Academy',
        description: type === 'subscribe' ? `Subscription: ${subscriptionPeriod === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}` : type === 'gift' ? 'Course Gift Purchase' : 'Course Purchase',
        order_id: razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: '9999999999', // Bypasses Razorpay check
        },
        theme: {
          color: '#A435F0', // Udemy brand purple
        },
        handler: async function (response: any) {
          try {
            // Step 3: Verify Payment Signature on Backend
            await api.post('/orders/verify', null, {
              params: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });
            
            // Invalidate enrollments cache so the list updates immediately
            queryClient.invalidateQueries({ queryKey: ['myCourses'] });
            if (activeCourse) {
              queryClient.invalidateQueries({ queryKey: ['checkEnrollment', activeCourse.id] });
            }
            
            if (type !== 'subscribe') {
              clearCart();
            }
            
            if (type === 'gift') {
              alert(`Success! A gift enrollment code has been sent to ${recipientEmail} with your personal message!`);
              router.push('/courses');
            } else {
              alert(type === 'subscribe' ? 'Subscription active! Course unlocked.' : 'Payment Successful! Courses unlocked.');
              if (activeCourse) {
                router.push(`/learn/${activeCourse.id}`);
              } else if (cartItems.length > 0) {
                router.push(`/learn/${cartItems[0].course.id}`);
              } else {
                router.push('/courses');
              }
            }
          } catch (err) {
            alert('Payment verification failed.');
          } finally {
            setCheckingOut(false);
          }
        },
        modal: {
          ondismiss: function () {
            setCheckingOut(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
      setCheckingOut(false);
    }
  };

  const statesByCountry: Record<string, string[]> = {
    India: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
      'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
      'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
      'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
    ],
    'United States': [
      'California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 
      'Georgia', 'North Carolina', 'Michigan', 'Washington', 'Massachusetts'
    ],
    'United Kingdom': [
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    Canada: [
      'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 
      'Nova Scotia', 'New Brunswick'
    ],
    Australia: [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 
      'Tasmania'
    ],
    Germany: [
      'Bavaria', 'Baden-Württemberg', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 
      'Hesse', 'Lower Saxony', 'North Rhine-Westphalia', 'Saxony'
    ]
  };

  const countries = Object.keys(statesByCountry);
  const activeStates = statesByCountry[billingCountry] || [];

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
      </div>
    );
  }

  const courseTitle = activeCourse?.title || (cartItems.length > 0 ? `${cartItems.length} courses in Cart` : 'Selected course');

  return (
    <div className="max-w-[1080px] mx-auto w-full px-6 py-12 flex-grow flex flex-col bg-white">
      
      {/* 1. Header with Breadcrumb Back Arrow */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-purple transition-colors mb-6 border-none bg-transparent cursor-pointer w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to learning
      </button>

      <div className="flex flex-col lg:flex-row gap-12 items-start flex-grow">
        
        {/* Left Column: Checkout Form Elements */}
        <div className="flex-grow space-y-8 w-full lg:max-w-[660px]">
          
          <div>
            <h1 className="text-3xl font-extrabold text-brand-charcoal leading-tight">
              Checkout to start learning
            </h1>
          </div>

          {/* 2. Container holding course summary, selection cards, and value props */}
          <div className="border border-brand-grey p-6 rounded-[4px] bg-white">
            
            {/* Banner block */}
            <div className="flex gap-4 items-center">
              <div className="h-[60px] w-[100px] relative overflow-hidden select-none shrink-0 rounded border border-brand-grey bg-gray-50">
                <img 
                  src={getCourseThumbnail(activeCourse?.category || 'Software Engineering', activeCourse?.slug || '', activeCourse?.title || '')} 
                  alt={courseTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs text-brand-charcoal font-medium leading-relaxed">
                {type === 'subscribe' ? (
                  <span>
                    Unlock <strong className="text-brand-charcoal font-bold">{courseTitle}</strong>, plus get access to 28,000+ top-rated professional and personal development courses when you subscribe to Personal Plan.
                  </span>
                ) : (
                  <span>
                    Unlock <strong className="text-brand-charcoal font-bold">{courseTitle}</strong> with lifetime access and start learning immediately.
                  </span>
                )}
              </div>
            </div>

            {type === 'subscribe' && (
              <>
                <hr className="border-t border-brand-grey my-6" />

                {/* Grid layout of Yearly and Monthly options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Yearly Card */}
                  <div 
                    onClick={() => setSubscriptionPeriod('yearly')}
                    className={`p-4 rounded-[4px] border cursor-pointer select-none transition-all flex items-start gap-3 bg-white ${
                      subscriptionPeriod === 'yearly' ? 'border-[#a435f0] border-2 shadow-sm' : 'border-brand-grey hover:bg-brand-bg/5'
                    }`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      subscriptionPeriod === 'yearly' ? 'border-brand-purple' : 'border-[#6a6f73]'
                    }`}>
                      {subscriptionPeriod === 'yearly' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-[#1c1d1f] text-sm">Yearly Access</p>
                      <p className="font-extrabold text-[#1c1d1f] text-lg mt-1 flex items-center gap-2 flex-wrap">
                        ₹500.00/mo
                        <span className="inline-block bg-[#acf2d0] text-[#1c5b3c] text-[10px] font-extrabold px-2 py-0.5 rounded">
                          Save ₹3,960
                        </span>
                      </p>
                      <p className="text-[10px] text-[#6a6f73] mt-2 font-medium">₹6,000.00 billed yearly</p>
                    </div>
                  </div>

                  {/* Monthly Card */}
                  <div 
                    onClick={() => setSubscriptionPeriod('monthly')}
                    className={`p-4 rounded-[4px] border cursor-pointer select-none transition-all flex items-start gap-3 bg-white ${
                      subscriptionPeriod === 'monthly' ? 'border-[#a435f0] border-2 shadow-sm' : 'border-brand-grey hover:bg-brand-bg/5'
                    }`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      subscriptionPeriod === 'monthly' ? 'border-brand-purple' : 'border-[#6a6f73]'
                    }`}>
                      {subscriptionPeriod === 'monthly' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-[#1c1d1f] text-sm">Monthly Access</p>
                      <p className="font-extrabold text-[#1c1d1f] text-lg mt-1">₹780.00/mo</p>
                      <p className="text-[10px] text-[#6a6f73] mt-2 font-medium pt-5">billed monthly</p>
                    </div>
                  </div>

                </div>

                {/* What's included block */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-extrabold text-xs text-[#1c1d1f] uppercase tracking-wider">What's included</h3>
                  <ul className="space-y-3.5 text-xs text-[#1c1d1f] font-medium">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#1c1d1f] shrink-0 mt-0.5" strokeWidth={3} />
                      <span>Access to over 28,000 of our top courses in tech, business, and more</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#1c1d1f] shrink-0 mt-0.5" strokeWidth={3} />
                      <span>Hands-on learning experiences to build your skills</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#1c1d1f] shrink-0 mt-0.5" strokeWidth={3} />
                      <span>Course recommendations to help you start learning faster</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {type !== 'subscribe' && (
              <div className="mt-4 text-xs text-[#1c1d1f] leading-relaxed">
                <p>You are purchasing lifetime access to the selected courses. You will receive all future updates and course resources.</p>
              </div>
            )}

          </div>

          {/* 3. Billing Address dropdown fields */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-lg text-brand-charcoal">Billing address</h3>
            
            <div className="flex flex-col md:flex-row gap-6 select-none">
              
              {/* Country dropdown selector */}
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-extrabold text-[#1c1d1f] uppercase select-none">Country</span>
                <div className="relative">
                  <Globe className="w-4 h-4 text-brand-charcoal absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select 
                    value={billingCountry}
                    onChange={(e) => {
                      setBillingCountry(e.target.value);
                      setBillingState('');
                    }}
                    className="h-[44px] w-full border border-brand-charcoal rounded-[4px] pl-9 pr-10 text-xs font-bold text-brand-charcoal bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-brand-purple"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-charcoal">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* State/Union dropdown selector */}
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-extrabold text-[#1c1d1f] uppercase select-none">State / Province / Territory</span>
                <div className="relative">
                  <select 
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    className="h-[44px] w-full border border-brand-charcoal rounded-[4px] pl-3 pr-10 text-xs font-bold text-brand-charcoal bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-brand-purple"
                  >
                    <option value="">Please select...</option>
                    {activeStates.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-charcoal">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Payment Method cards */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-brand-charcoal">Payment Method</h3>
              <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                Secure and encrypted <Lock className="w-3.5 h-3.5 text-gray-400" />
              </span>
            </div>

            <div className="border border-brand-grey rounded-[4px] overflow-hidden bg-white">
              
              {/* Option A: UPI App QR */}
              <div className="border-b border-brand-grey">
                <div 
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                    paymentMethod === 'upi' ? 'bg-[#F7F9FA]' : 'hover:bg-brand-bg/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'upi' ? 'border-brand-purple' : 'border-[#6a6f73]'
                    }`}>
                      {paymentMethod === 'upi' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-[#1c1d1f] border border-[#1c1d1f] px-1.5 py-0.5 rounded italic tracking-wider leading-none">
                        UPI
                      </span>
                      <span className="text-xs font-bold text-brand-charcoal">UPI</span>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'upi' && (
                  <div className="p-4 bg-white border-t border-brand-grey text-xs text-gray-500 space-y-2 select-none leading-relaxed font-medium">
                    <p>After generating the QR code you can use your preferred UPI app to complete the payment.</p>
                    <p>Click the <strong>"Start Subscription"</strong> button to generate a QR code for UPI payment.</p>
                  </div>
                )}
              </div>

              {/* Option B: Cards */}
              <div>
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                    paymentMethod === 'card' ? 'bg-[#F7F9FA]' : 'hover:bg-brand-bg/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'border-brand-purple' : 'border-[#6a6f73]'
                    }`}>
                      {paymentMethod === 'card' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal">Cards</span>
                  </div>
                  
                  {/* Card logos */}
                  <div className="flex gap-1 select-none">
                    <span className="text-[8px] font-bold border border-zinc-200 px-1 py-0.5 rounded text-blue-800 bg-white tracking-wider leading-none flex items-center">
                      VISA
                    </span>
                    <span className="text-[8px] font-bold border border-zinc-200 px-1 py-0.5 rounded text-red-500 bg-white tracking-wider leading-none flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block -ml-1"></span>
                    </span>
                    <span className="text-[8px] font-bold border border-zinc-200 px-1 py-0.5 rounded text-[#0168b3] bg-white tracking-wider leading-none flex items-center">
                      AMEX
                    </span>
                    <span className="text-[8px] font-bold border border-zinc-200 px-1 py-0.5 rounded text-[#f58220] bg-white tracking-wider leading-none flex items-center">
                      DISCOVER
                    </span>
                    <span className="text-[8px] font-bold border border-zinc-200 px-1 py-0.5 rounded text-[#006cc0] bg-white tracking-wider leading-none flex items-center">
                      JCB
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 5. Coupon / Discount Code Section */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-lg text-brand-charcoal">Promotions</h3>
            
            <div className="border border-brand-grey rounded-[4px] p-4 bg-white space-y-3">
              <div className="flex gap-2">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponResult) setCouponResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidateCoupon();
                    }}
                    placeholder="Enter coupon code"
                    className="h-[44px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-bold text-brand-charcoal bg-white placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-1 focus:ring-brand-purple uppercase tracking-wider"
                    disabled={couponLoading || (couponResult?.valid === true)}
                    id="coupon-input"
                  />
                </div>
                {couponResult?.valid ? (
                  <button
                    onClick={clearCoupon}
                    className="h-[44px] px-5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-[4px] transition-colors cursor-pointer border-none whitespace-nowrap"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleValidateCoupon()}
                    disabled={couponLoading || !couponCode}
                    className="h-[44px] px-5 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white text-xs font-bold rounded-[4px] transition-colors cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"
                  >
                    {couponLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                )}
              </div>

              {/* Coupon validation result feedback */}
              {couponResult && (
                <div className={`text-xs font-medium px-3 py-2.5 rounded-[4px] flex items-start gap-2 ${
                  couponResult.valid 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {couponResult.valid ? (
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <span className="shrink-0 mt-0.5 text-red-500 font-bold">✕</span>
                  )}
                  <span>{couponResult.message}</span>
                </div>
              )}

              {/* Available coupon hints */}
              {!couponResult?.valid && (
                <div className="text-[10px] text-gray-400 font-medium space-y-1 select-none">
                  <p>Try: <span className="font-bold text-gray-500 cursor-pointer hover:text-brand-purple transition-colors" onClick={() => { setCouponCode('WELCOME20'); setCouponResult(null); }}>WELCOME20</span> · <span className="font-bold text-gray-500 cursor-pointer hover:text-brand-purple transition-colors" onClick={() => { setCouponCode('SUMMER50'); setCouponResult(null); }}>SUMMER50</span> · <span className="font-bold text-gray-500 cursor-pointer hover:text-brand-purple transition-colors" onClick={() => { setCouponCode('FLAT100'); setCouponResult(null); }}>FLAT100</span></p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary Sidebar (Flat layout directly on white background) */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#1c1d1f]">Summary</h2>

            {type === 'gift' && (
              <div className="bg-purple-50 border border-brand-purple/20 p-4 rounded-[4px] space-y-2 text-xs text-brand-charcoal select-none">
                <h4 className="font-bold text-[#A435F0] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  Gifting this course
                </h4>
                <div className="space-y-1 font-medium">
                  <p><span className="text-gray-500 font-semibold">Recipient:</span> <span className="font-bold">{recipientName}</span></p>
                  <p><span className="text-gray-500 font-semibold">Email:</span> <span className="font-bold">{recipientEmail}</span></p>
                  <p><span className="text-gray-500 font-semibold">Delivery:</span> <span className="font-bold">{deliveryDate}</span></p>
                  {message && (
                    <p className="mt-2 border-t border-purple-100 pt-2 text-gray-600 italic leading-relaxed">
                      "{message}"
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              
              {/* Course Title and price line */}
              <div className="flex justify-between gap-4 items-start pb-4">
                <span className="text-brand-purple hover:underline cursor-pointer text-xs font-semibold w-[75%] leading-relaxed">
                  {courseTitle}
                </span>
                <span className="text-brand-purple text-xs font-semibold whitespace-nowrap">
                  {type === 'subscribe' ? '₹0.00' : `₹${totals.subtotal.toFixed(2)}`}
                </span>
              </div>

              <hr className="border-t border-brand-grey" />

              {/* Subscription Access price line */}
              {type === 'subscribe' ? (
                <div className="flex justify-between text-xs font-medium text-[#1c1d1f] py-2">
                  <span>
                    {subscriptionPeriod === 'yearly' ? 'Yearly access:' : 'Monthly access:'}
                  </span>
                  <span>
                    ₹{totals.subtotal.toFixed(2)}{totals.periodText}
                  </span>
                </div>
              ) : null}

              {/* Coupon discount line (works for all checkout types) */}
              {totals.discount > 0 && couponResult?.valid && (
                <div className="flex justify-between text-xs font-medium text-emerald-800 py-2">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon ({couponResult.code})
                    {couponResult.discountType === 'PERCENTAGE' && ` · ${couponResult.discountValue}% off`}
                    {couponResult.discountType === 'FIXED_AMOUNT' && ` · ₹${couponResult.discountValue} flat`}
                  </span>
                  <span className="font-bold">-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}

              <hr className="border-t border-brand-grey" />

              {/* Total Row */}
              <div className="flex justify-between text-sm font-medium text-[#1c1d1f] py-2">
                <span className="font-bold text-sm">Total:</span>
                <span className="font-extrabold text-base">
                  ₹{totals.total.toFixed(2)}{totals.periodText}
                </span>
              </div>

              <hr className="border-t border-brand-grey" />

              {/* Disclaimers & Info */}
              <div className="text-[10px] text-gray-500 leading-relaxed font-medium space-y-3 select-none">
                <p>
                  <strong>Cancel anytime</strong> by visiting the Subscriptions page in your account.
                </p>
                <p>
                  Your subscription will begin today and a charge of ₹{totals.total.toFixed(2)} automatically each {subscriptionPeriod === 'yearly' ? 'year' : 'month'} after that until you cancel. Cancel prior to the start of any future billing periods to avoid future charges. By clicking "{type === 'subscribe' ? 'Start Subscription' : 'Complete Payment'}" you agree to our <span className="underline cursor-pointer">Terms</span> and authorize this recurring charge. No refunds or partial credits except where required by law.
                </p>
                <p>
                  Free course with purchase of Personal Plan. Not available to existing subscribers. Non-transferable, non-refundable, no cash value, and not redeemable for credits. Access revoked if subscription is terminated before end of initial term.
                </p>
              </div>

              {/* Execute Payment button */}
              <button
                onClick={handlePayment}
                disabled={checkingOut}
                className="h-[48px] w-full bg-[#ab7cf6] hover:bg-brand-purple-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none disabled:bg-purple-300 rounded-[4px] border-none"
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 fill-white text-white" />
                    <span>{type === 'subscribe' ? 'Start Subscription' : type === 'gift' ? 'Send Gift Course' : 'Complete Payment'}</span>
                  </>
                )}
              </button>

            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
