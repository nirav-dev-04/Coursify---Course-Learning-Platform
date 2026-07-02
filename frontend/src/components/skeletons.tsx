'use client';

import React from 'react';

// Single course card skeleton matching CourseCard layout
export function CourseCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg overflow-hidden border border-brand-grey bg-white flex flex-col h-[300px]">
            {/* Thumbnail */}
            <div className="bg-gray-200 aspect-[16/10] w-full" />
            {/* Body */}
            <div className="p-3 flex-grow flex flex-col justify-between space-y-2">
              <div className="space-y-2">
                <div className="bg-gray-200 h-4 rounded w-full" />
                <div className="bg-gray-200 h-3 rounded w-3/4" />
                <div className="bg-gray-200 h-3 rounded w-1/2" />
              </div>
              <div className="bg-gray-200 h-4 rounded w-1/4 mt-4" />
            </div>
          </div>
        ))}
    </div>
  );
}

// Homepage Hero + CourseCard skeleton loader
export function HomepageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-6 space-y-12">
      {/* Hero skeleton */}
      <div className="relative w-full min-h-[360px] bg-gray-200 animate-pulse rounded-md flex flex-col justify-center p-12 space-y-4">
        <div className="bg-gray-300 h-8 rounded w-1/2" />
        <div className="bg-gray-300 h-4 rounded w-1/3" />
        <div className="bg-gray-300 h-10 rounded w-36" />
      </div>
      
      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="bg-gray-200 h-4 rounded w-2/3" />
              <div className="bg-gray-200 h-3 rounded w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="space-y-4">
        <div className="bg-gray-200 h-6 rounded w-48 animate-pulse" />
        <CourseCardSkeleton count={4} />
      </div>
    </div>
  );
}

// Course detail skeleton loader
export function CourseDetailSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-8 bg-white">
      {/* Banner */}
      <div className="bg-brand-charcoal py-16 px-6 md:px-12 text-white">
        <div className="max-w-6xl mx-auto w-full md:pr-[380px] space-y-4">
          <div className="bg-gray-700 h-3 rounded w-24" />
          <div className="bg-gray-700 h-8 rounded w-3/4" />
          <div className="bg-gray-700 h-4 rounded w-full" />
          <div className="bg-gray-700 h-4 rounded w-2/3" />
          <div className="bg-gray-700 h-3 rounded w-48 mt-2" />
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-grow md:max-w-[700px] space-y-6">
          <div className="bg-gray-200 h-48 rounded" />
          <div className="bg-gray-200 h-8 rounded w-48" />
          <div className="bg-gray-200 h-4 rounded w-full" />
          <div className="bg-gray-200 h-4 rounded w-full" />
          <div className="bg-gray-200 h-4 rounded w-3/4" />
        </div>
        <div className="w-full md:w-[320px] shrink-0 space-y-4">
          <div className="bg-gray-200 h-[300px] rounded border border-brand-grey" />
        </div>
      </div>
    </div>
  );
}

// Learn page video stream + curriculum list skeleton
export function LearnPageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-brand-charcoal animate-pulse">
      {/* Video Stream section */}
      <div className="flex-grow bg-black flex items-center justify-center aspect-video lg:aspect-auto">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center" />
      </div>
      
      {/* Curriculum list sidebar */}
      <div className="w-full lg:w-[360px] bg-brand-charcoal border-t lg:border-t-0 lg:border-l border-brand-charcoal-hover shrink-0 flex flex-col p-4 space-y-4">
        <div className="bg-gray-700 h-5 rounded w-1/3" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2 border-b border-brand-charcoal-hover pb-3">
            <div className="bg-gray-700 h-4 rounded w-3/4" />
            <div className="bg-gray-700 h-3 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Checkout form + summary skeleton
export function CheckoutSkeleton() {
  return (
    <div className="max-w-[1080px] mx-auto w-full px-6 py-12 flex-grow flex flex-col bg-white animate-pulse gap-6">
      <div className="bg-gray-200 h-4 rounded w-28" />
      <div className="flex flex-col lg:flex-row gap-12 items-start flex-grow">
        <div className="flex-grow space-y-8 w-full lg:max-w-[660px]">
          <div className="bg-gray-200 h-8 rounded w-2/3" />
          <div className="bg-gray-200 h-44 rounded border border-brand-grey" />
          <div className="bg-gray-200 h-36 rounded border border-brand-grey" />
        </div>
        <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-gray-200 h-[240px] rounded border border-brand-grey" />
        </aside>
      </div>
    </div>
  );
}
