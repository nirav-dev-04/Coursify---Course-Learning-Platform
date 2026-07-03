'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loading, error } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!name || !email || !password || !role) {
      setFormError('Please fill in all fields.');
      return;
    }

    try {
      await register({ name, email, password, role });
      setSuccessMsg('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      // Handled by hook
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        router.push('/');
      }
    } catch (err) {
      // Handled by hook
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-white px-6 py-12 md:py-20">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Illustration (hidden on small screens) */}
        <div className="hidden md:flex justify-center items-center select-none">
          <Image 
            src="/udemy_auth_illustration.png" 
            alt="Coursify authentication illustration" 
            width={380}
            height={380}
            priority
            className="max-w-full h-auto object-contain"
          />
        </div>

        {/* Right Side: Form */}
        <div className="w-full max-w-[380px] mx-auto space-y-6">
          <div>
            <h2 className="text-base font-bold text-brand-charcoal mb-2">
              Sign up and start learning
            </h2>
          </div>

          {/* Display Error Message */}
          {(error || formError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {formError || error}
            </div>
          )}

          {/* Display Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              {successMsg}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[48px] px-4 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none transition-colors text-brand-charcoal font-medium placeholder-gray-500"
                required
                autoComplete="no-autofill"
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[48px] px-4 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none transition-colors text-brand-charcoal font-medium placeholder-gray-500"
                required
                autoComplete="no-autofill"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[48px] pl-4 pr-12 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none transition-colors text-brand-charcoal font-medium placeholder-gray-500"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[14px] text-gray-500 hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer p-0"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Role selector dropdown */}
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-[48px] px-4 border border-brand-charcoal focus:border-brand-purple text-sm focus:outline-none bg-white transition-colors text-brand-charcoal font-medium cursor-pointer"
              >
                <option value="STUDENT">Student Profile (Learn Courses)</option>
                <option value="INSTRUCTOR">Instructor Profile (Sell Courses)</option>
              </select>
            </div>

            {/* Checkbox for specials */}
            <div className="flex items-start gap-2.5 pt-1">
              <input 
                type="checkbox" 
                id="special-offers" 
                defaultChecked 
                className="w-4 h-4 mt-0.5 border border-brand-charcoal accent-brand-purple cursor-pointer rounded-sm"
              />
              <label htmlFor="special-offers" className="text-xs text-brand-charcoal select-none leading-normal font-medium cursor-pointer">
                Send me special offers, personalized recommendations, and learning tips.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-sm transition-colors flex items-center justify-center cursor-pointer disabled:bg-purple-300"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-brand-grey"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-bold uppercase select-none">Other sign up options</span>
            <div className="flex-grow border-t border-brand-grey"></div>
          </div>

          {/* Google Authentication */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setFormError('Google Sign-in failed. Please try again.')}
              shape="square"
              text="signup_with"
            />
          </div>

          {/* Navigation Footer */}
          <div className="pt-4 border-t border-brand-grey text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-brand-purple hover:underline transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
