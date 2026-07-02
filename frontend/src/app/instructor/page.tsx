'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function InstructorPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) { 
      router.replace('/login?redirect=/instructor'); 
      return; 
    }
    if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
      router.replace('/instructor/dashboard');
    } else {
      router.replace('/instructor/onboarding');
    }
  }, [user, initialized, router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
