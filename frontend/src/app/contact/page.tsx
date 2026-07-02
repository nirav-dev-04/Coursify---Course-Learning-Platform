'use client';

import React, { useState } from 'react';
import FooterNavbar from '../../components/FooterNavbar';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Tag, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  Code,
  ArrowRight
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sentDetails, setSentDetails] = useState({ name: '', email: '', subject: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API request timeout
    setTimeout(() => {
      setSentDetails({
        name: formData.name,
        email: formData.email,
        subject: formData.subject
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-charcoal">
      {/* Sub-nav menu */}
      <FooterNavbar />

      {/* Split layout: Form/Success Card on Left, Support Image on Right */}
      <section className="max-w-6xl mx-auto w-full py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-grow">
        
        {/* Left Section: Conditional rendering of Form or Success Feedback */}
        <div className="space-y-6">
          {!submitted ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
                  Contact Us
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-brand-charcoal leading-tight">
                  Get in touch with EduFlow support
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Have questions about billing, account settings, or courses? Fill out the contact form below and our team will assist you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-brand-charcoal uppercase mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nirav Mathukiya"
                      className="w-full pl-10 pr-4 h-[44px] border border-brand-grey focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple rounded-[4px] focus:outline-none text-sm font-medium text-brand-charcoal transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-brand-charcoal uppercase mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nirav@example.com"
                      className="w-full pl-10 pr-4 h-[44px] border border-brand-grey focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple rounded-[4px] focus:outline-none text-sm font-medium text-brand-charcoal transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Subject Input */}
                <div>
                  <label htmlFor="subject" className="block text-xs font-bold text-brand-charcoal uppercase mb-1.5">
                    Subject
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Tag className="w-4 h-4" />
                    </span>
                    <input
                      id="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Billing support / Video playback issues"
                      className="w-full pl-10 pr-4 h-[44px] border border-brand-grey focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple rounded-[4px] focus:outline-none text-sm font-medium text-brand-charcoal transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-brand-charcoal uppercase mb-1.5">
                    Message
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your issue in detail here..."
                      className="w-full pl-10 pr-4 pt-3 pb-3 border border-brand-grey focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple rounded-[4px] focus:outline-none text-sm font-medium text-brand-charcoal resize-none transition-all bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] w-full bg-brand-charcoal hover:bg-brand-charcoal-hover text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors border-none cursor-pointer rounded-[4px] select-none"
                >
                  {submitting ? 'Sending message...' : 'Submit Message'}
                </button>
              </form>
            </div>
          ) : (
            /* Premium Success Feedback Card */
            <div className="bg-white border border-brand-grey rounded-lg p-8 shadow-md space-y-6 max-w-lg animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-full shrink-0">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Sent
                  </span>
                  <h2 className="text-xl font-extrabold text-brand-charcoal mt-0.5">
                    Message Sent Successfully
                  </h2>
                </div>
              </div>

              <div className="space-y-3 border-t border-brand-grey/50 pt-4 text-xs font-medium text-gray-600 leading-relaxed">
                <p>
                  Thank you for reaching out, <strong>{sentDetails.name}</strong>! We have received your query regarding:
                </p>
                <div className="bg-brand-bg p-3.5 rounded border border-brand-grey/50 font-mono text-gray-700">
                  <strong>Subject:</strong> {sentDetails.subject}
                </div>
                <p>
                  A confirmation dispatch has been logged to <strong>{sentDetails.email}</strong>. Our developer support desk typically responds in under 24 hours.
                </p>
              </div>

              <div className="pt-4 border-t border-brand-grey/50">
                <button
                  onClick={() => setSubmitted(false)}
                  className="h-[40px] px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs uppercase tracking-wider rounded-[4px] transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Send Another Message
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Image */}
        <div className="relative h-[440px] w-full rounded overflow-hidden shadow-lg select-none">
          <img 
            src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=600&auto=format&fit=crop" 
            alt="Customer Support Desk" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-purple/10 mix-blend-multiply" />
        </div>
      </section>

      {/* Interactive Support Cards Section (Replaces info strip) */}
      <section className="bg-brand-charcoal text-white py-16 px-6 select-none mt-auto">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Email Support */}
            <a 
              href="mailto:support@eduflow.com" 
              className="bg-[#2D2F31] border border-brand-charcoal hover:border-brand-purple p-6 rounded-lg shadow-sm hover:shadow transition-all group block text-left"
            >
              <div className="p-3 bg-brand-charcoal group-hover:bg-brand-purple/10 rounded-lg w-fit transition-colors mb-4">
                <Mail className="w-5 h-5 text-brand-purple" />
              </div>
              <h4 className="font-extrabold text-sm text-white mb-1">
                Email Support
              </h4>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Send queries directly to our operations inbox. Click to compose.
              </p>
              <span className="text-xs font-bold text-brand-purple group-hover:text-brand-purple-hover transition-colors font-mono">
                support@eduflow.com
              </span>
            </a>

            {/* Card 2: Help Center */}
            <Link 
              href="/help"
              className="bg-[#2D2F31] border border-brand-charcoal hover:border-brand-purple p-6 rounded-lg shadow-sm hover:shadow transition-all group block text-left"
            >
              <div className="p-3 bg-brand-charcoal group-hover:bg-brand-purple/10 rounded-lg w-fit transition-colors mb-4">
                <HelpCircle className="w-5 h-5 text-brand-purple" />
              </div>
              <h4 className="font-extrabold text-sm text-white mb-1">
                FAQ Help Center
              </h4>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Find answers regarding payment issues, playback speed, and certificates.
              </p>
              <span className="text-xs font-bold text-brand-purple group-hover:text-brand-purple-hover transition-colors flex items-center gap-1.5">
                Go to Help Center
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Card 3: Developer Desk */}
            <div 
              className="bg-[#2D2F31] border border-brand-charcoal hover:border-brand-purple p-6 rounded-lg shadow-sm hover:shadow transition-all group block text-left"
            >
              <div className="p-3 bg-brand-charcoal group-hover:bg-brand-purple/10 rounded-lg w-fit transition-colors mb-4">
                <Code className="w-5 h-5 text-brand-purple" />
              </div>
              <h4 className="font-extrabold text-sm text-white mb-1">
                Developer Desk
              </h4>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Designed and developed for college submission by Nirav's team.
              </p>
              <span className="text-xs font-bold text-gray-400 font-mono">
                Gujarat, India
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
