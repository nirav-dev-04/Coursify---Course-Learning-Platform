'use client';

import React from 'react';
import FooterNavbar from '../../components/FooterNavbar';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-charcoal">
      {/* Sub-nav menu */}
      <FooterNavbar />

      {/* Split layout: Image on Left, Privacy Text on Right */}
      <section className="max-w-6xl mx-auto w-full py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-grow">
        
        {/* Left Image */}
        <div className="relative h-[380px] w-full rounded overflow-hidden shadow-lg select-none">
          <img 
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop" 
            alt="Cybersecurity and Privacy" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-purple/10 mix-blend-multiply" />
        </div>

        {/* Right Legal Text */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
              Legal Center
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-charcoal leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-400">
              Last Updated: June 14, 2026
            </p>
          </div>

          <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed overflow-y-auto max-h-[400px] pr-4 border-t border-brand-grey pt-4">
            <h3 className="font-bold text-brand-charcoal">1. Information We Collect</h3>
            <p>
              We collect credentials (name, email address, password hashes) during registration, and database records of progress logs and transactions to provide dynamic course recommendations.
            </p>

            <h3 className="font-bold text-brand-charcoal">2. Progress Cache & Tracking</h3>
            <p>
              To ensure smooth playback tracking, we cache video playback heartbeat records (percent watched) in Redis. This data is periodically written back to the relational database.
            </p>

            <h3 className="font-bold text-brand-charcoal">3. Data Security</h3>
            <p>
              All student data, including transaction tokens and passwords, are protected using standard BCrypt hash encryptions and JSON Web Token (JWT) request headers.
            </p>

            <h3 className="font-bold text-brand-charcoal">4. Third-Party Sharing</h3>
            <p>
              We do not sell, distribute, or share student private information with any third-party marketing entities.
            </p>

            <h3 className="font-bold text-brand-charcoal">5. Contact Information</h3>
            <p>
              For privacy requests or database erasure claims, contact developer Nirav at support@eduflow.com.
            </p>
          </div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="bg-brand-charcoal text-white py-12 px-6 text-center select-none mt-auto">
        <p className="text-xs text-gray-500">
          © 2026 EduFlow Corporation. Designed & Developed by Nirav.
        </p>
      </section>
    </div>
  );
}
