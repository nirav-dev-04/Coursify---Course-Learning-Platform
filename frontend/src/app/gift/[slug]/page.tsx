'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Course } from '../../../lib/types';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, ArrowLeft, Gift } from 'lucide-react';
import { getCourseThumbnail } from '../../../lib/utils/thumbnail';

export default function GiftCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;
  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Default to today's date formatted as YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch course details
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['courseDetail', slug],
    queryFn: async () => {
      const response = await api.get(`/courses/${slug}`);
      return response.data;
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=/gift/${slug}`);
    }
  }, [user, isLoading, router, slug]);

  if (isLoading || !course) {
    return (
      <div className="flex-grow flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!recipientName.trim()) {
      newErrors.recipientName = "Recipient's name is required";
    }
    if (!recipientEmail.trim()) {
      newErrors.recipientEmail = "Recipient's email is required";
    } else if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      newErrors.recipientEmail = "Please enter a valid email address";
    }
    if (!deliveryDate) {
      newErrors.deliveryDate = "Delivery date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const query = new URLSearchParams({
      type: 'gift',
      courseId: String(course.id),
      recipientName,
      recipientEmail,
      deliveryDate,
      message
    });
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <div className="max-w-[1080px] mx-auto w-full px-6 py-12 flex-grow flex flex-col bg-white">
      {/* Back link */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-purple transition-colors mb-6 border-none bg-transparent cursor-pointer w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </button>

      <div className="text-center md:text-left mb-8">
        <h1 className="text-3xl font-extrabold text-brand-charcoal flex items-center justify-center md:justify-start gap-2.5">
          <Gift className="w-8 h-8 text-brand-purple" />
          Gift a course
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start flex-grow">
        {/* Left Column: Form */}
        <form onSubmit={handleProceed} className="w-full lg:max-w-[620px] space-y-6 flex-grow">
          {/* Recipient's Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase select-none">
              Recipient's Name:
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
              className={`h-[44px] w-full border ${errors.recipientName ? 'border-red-500' : 'border-brand-charcoal'} rounded-[4px] px-3.5 text-sm font-semibold text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-purple`}
            />
            {errors.recipientName && (
              <p className="text-xs text-red-500 font-bold">{errors.recipientName}</p>
            )}
          </div>

          {/* Recipient's Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase select-none">
              Recipient's Email:
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="john@doe.com"
              className={`h-[44px] w-full border ${errors.recipientEmail ? 'border-red-500' : 'border-brand-charcoal'} rounded-[4px] px-3.5 text-sm font-semibold text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-purple`}
            />
            {errors.recipientEmail && (
              <p className="text-xs text-red-500 font-bold">{errors.recipientEmail}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase select-none">
              When do you want to send this gift?
            </label>
            <div className="relative">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`h-[44px] w-full border ${errors.deliveryDate ? 'border-red-500' : 'border-brand-charcoal'} rounded-[4px] px-3.5 text-sm font-semibold text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-purple`}
              />
            </div>
            {errors.deliveryDate && (
              <p className="text-xs text-red-500 font-bold">{errors.deliveryDate}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase select-none">
              Your Message (optional):
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add your personal message here"
              className="w-full border border-brand-charcoal rounded-[4px] p-3 text-sm font-semibold text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-purple resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="h-[48px] w-full md:w-auto md:px-8 bg-[#A435F0] hover:bg-[#8710D8] text-white font-bold text-sm transition-colors cursor-pointer select-none rounded-[4px] border-none shadow-md"
          >
            Proceed to Checkout
          </button>
        </form>

        {/* Right Column: Course Card Preview */}
        <aside className="w-full lg:w-[360px] shrink-0 border border-brand-grey p-6 rounded-md bg-[#F7F9FA] space-y-4">
          <div className="h-[180px] w-full relative overflow-hidden rounded border border-brand-grey bg-gray-50 select-none">
            <img
              src={getCourseThumbnail(course.category, course.slug, course.title)}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-base text-brand-charcoal leading-snug">
              {course.title}
            </h4>
            <p className="text-xs text-gray-500 font-medium">
              an online course by <span className="font-bold">{course.instructor?.name || 'EduFlow Instructor'}</span>
            </p>
          </div>

          <hr className="border-t border-brand-grey" />

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-xs font-bold text-brand-charcoal">Gift value:</span>
            <span className="font-extrabold text-lg text-brand-charcoal">
              {course.price === 0 ? 'Free' : `₹${course.price.toFixed(2)}`}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
