'use client';

import React from 'react';
import FooterNavbar from '../../components/FooterNavbar';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-charcoal">
      {/* Sub-nav menu */}
      <FooterNavbar />

      {/* Split layout: Text on Left, Contract Image on Right */}
      <section className="max-w-6xl mx-auto w-full py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-grow">
        
        {/* Left Legal Text */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
              Legal Center
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-charcoal leading-tight">
              Terms of Use
            </h1>
            <p className="text-xs text-gray-400">
              Last Updated: June 14, 2026
            </p>
          </div>

          <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed overflow-y-auto max-h-[400px] pr-4 border-t border-brand-grey pt-4">
            <h3 className="font-bold text-brand-charcoal">1. Acceptance of Terms</h3>
            <p>
              By signing up, logging in, or purchasing any educational contents on the EduFlow e-learning marketplace, you agree to comply with and be bound by these Terms of Use.
            </p>

            <h3 className="font-bold text-brand-charcoal">2. Student Accounts</h3>
            <p>
              You must maintain a valid email address and account credentials. You are responsible for all actions taken under your account. Sharing credentials or distributing course videos is strictly prohibited.
            </p>

            <h3 className="font-bold text-brand-charcoal">3. Course Purchases & Refunds</h3>
            <p>
              Course prices listed in Indian Rupees (₹) are dynamic. All transaction logs are managed using secure idempotent mechanisms to prevent double charges. Refunds are processed according to our corporate policy.
            </p>

            <h3 className="font-bold text-brand-charcoal">4. Intellectual Property</h3>
            <p>
              All video content, code lectures, architecture slides, and resources are the exclusive properties of the course instructors and EduFlow. Users are granted a single-device personal playback license.
            </p>

            <h3 className="font-bold text-brand-charcoal">5. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be settled in court jurisdictions local to Gujarat, India.
            </p>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative h-[380px] w-full rounded overflow-hidden shadow-lg select-none">
          <img 
            src="https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=600&auto=format&fit=crop" 
            alt="Terms Contract Document" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-purple/10 mix-blend-multiply" />
        </div>
      </section>

      {/* Info Strip */}
      <section className="bg-brand-charcoal text-white py-12 px-6 text-center select-none mt-auto">
        <p className="text-xs text-gray-500">
          © 2026 EduFlow Corporation. Maintained by developer Nirav.
        </p>
      </section>
    </div>
  );
}
