'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Loader2, PlaySquare, FileCheck } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['Software Engineering', 'AI & Data Science', 'Finance & Trading'];

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'course', // 'course' | 'practice_test'
    title: '',
    category: '',
    description: '',
    price: '',
  });

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!form.type;
      case 2:
        return form.title.trim().length > 0;
      case 3:
        return !!form.category;
      case 4:
        return form.description.trim().length > 0 && form.price.trim().length > 0 && parseFloat(form.price) >= 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isStepValid()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/courses', {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        price: parseFloat(form.price),
        type: form.type === 'practice_test' ? 'PRACTICE_TEST' : 'COURSE',
      });
      router.push(`/instructor/courses/${res.data.id}/edit`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create course. Title must be unique.');
    } finally {
      setLoading(false);
    }
  }

  // Width of the progress bar
  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* 1. Header with progress indicators */}
      <header className="border-b border-brand-grey bg-white select-none">
        <div className="max-w-[1140px] mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-lg text-brand-charcoal">
              Cours<span className="text-brand-purple">ify</span>
            </span>
            <span className="h-4 w-px bg-brand-grey"></span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Step {step} of 4
            </span>
          </div>

          <Link
            href="/instructor/dashboard"
            className="text-xs font-bold text-brand-purple hover:underline"
            data-testid="exit-wizard-link"
          >
            Exit
          </Link>
        </div>

        {/* Real-time progress indicator bar */}
        <div className="h-[4px] w-full bg-brand-bg relative overflow-hidden">
          <div
            className="h-full bg-brand-purple transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      {/* 2. Main content setup area */}
      <main className="flex-grow flex items-center justify-center py-16 px-6">
        <div className="max-w-[600px] w-full space-y-8">
          
          {/* Step 1: Course Type */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal tracking-tight">
                  First, let&apos;s find out what type of course you&apos;re making.
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Select the learning experience that best matches your content format.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Course */}
                <button
                  type="button"
                  data-testid="card-course-type-video"
                  onClick={() => setForm(f => ({ ...f, type: 'course' }))}
                  className={`p-6 border text-left flex flex-col justify-between h-[220px] transition-all bg-white rounded-[4px] cursor-pointer hover:shadow-md ${
                    form.type === 'course'
                      ? 'border-brand-charcoal border-2 shadow-sm'
                      : 'border-brand-grey hover:border-gray-400'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    form.type === 'course' ? 'bg-purple-100 text-brand-purple' : 'bg-brand-bg text-gray-400'
                  }`}>
                    <PlaySquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-charcoal text-base">Course</h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Create rich learning experiences with the help of video lectures, quizzes, coding exercises, etc.
                    </p>
                  </div>
                </button>

                {/* Option 2: Practice Test */}
                <button
                  type="button"
                  data-testid="card-course-type-test"
                  onClick={() => setForm(f => ({ ...f, type: 'practice_test' }))}
                  className={`p-6 border text-left flex flex-col justify-between h-[220px] transition-all bg-white rounded-[4px] cursor-pointer hover:shadow-md ${
                    form.type === 'practice_test'
                      ? 'border-brand-charcoal border-2 shadow-sm'
                      : 'border-brand-grey hover:border-gray-400'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    form.type === 'practice_test' ? 'bg-purple-100 text-brand-purple' : 'bg-brand-bg text-gray-400'
                  }`}>
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-charcoal text-base">Practice Test</h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Help students prepare for certification exams by providing practice questions.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Title */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal tracking-tight">
                  How about a working title?
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Your working title will help frame your curriculum. You can always change it later.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. Learn React 19 & Next.js from Scratch"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  data-testid="wizard-input-title"
                  className="w-full h-[52px] px-4 border border-brand-charcoal focus:border-brand-purple text-base focus:outline-none transition-colors text-brand-charcoal font-semibold placeholder-gray-400 rounded-[4px]"
                  maxLength={100}
                />
                <div className="flex justify-between items-center text-xs text-gray-400 font-semibold px-0.5">
                  <span>Maximum 100 characters</span>
                  <span>{form.title.length}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal tracking-tight">
                  What category best fits the knowledge you&apos;re sharing?
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  If you&apos;re not sure, choose the closest one. You can change this category later.
                </p>
              </div>

              <div className="space-y-2">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  data-testid="wizard-select-category"
                  className="w-full h-[52px] px-4 border border-brand-charcoal focus:border-brand-purple text-base focus:outline-none transition-colors text-brand-charcoal font-bold placeholder-gray-400 rounded-[4px] bg-white cursor-pointer"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Pricing & Description */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal tracking-tight">
                  Finally, let&apos;s set a pricing tier and brief description.
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Enter your draft details to complete registration. You can finalize catalog pricing later.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                    Course Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Brief summary of what students will learn..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    data-testid="wizard-input-description"
                    className="w-full px-4 py-3 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none transition-colors text-brand-charcoal font-semibold placeholder-gray-400 rounded-[4px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="price" className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                    Price (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="e.g. 499"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    data-testid="wizard-input-price"
                    className="w-full h-[48px] px-4 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none transition-colors text-brand-charcoal font-semibold placeholder-gray-400 rounded-[4px]"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-xs py-2.5 bg-red-50 border border-red-200 rounded-[4px] text-center font-bold">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. Sticky footer navigation bar */}
      <footer className="border-t border-brand-grey bg-white py-4 px-6 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1140px] mx-auto w-full flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                data-testid="wizard-prev"
                className="px-5 h-[40px] border border-brand-charcoal hover:bg-brand-bg text-brand-charcoal text-xs font-bold rounded-[4px] cursor-pointer transition-colors bg-white"
              >
                Previous
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                data-testid="wizard-next"
                className="px-6 h-[40px] bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold rounded-[4px] cursor-pointer transition-colors disabled:opacity-40 border-none"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isStepValid()}
                data-testid="wizard-submit"
                className="px-6 h-[40px] bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold rounded-[4px] cursor-pointer transition-colors disabled:opacity-40 border-none flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Draft...
                  </>
                ) : (
                  'Create Course'
                )}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
