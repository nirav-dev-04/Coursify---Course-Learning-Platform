'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Hide the global Navbar on course learning paths. Those paths mount LearnNavbar instead.
  if (pathname.startsWith('/learn')) {
    return null;
  }

  return (
    <Suspense fallback={<div className="h-[72px] bg-brand-white border-b border-brand-grey w-full" />}>
      <Navbar />
    </Suspense>
  );
}

