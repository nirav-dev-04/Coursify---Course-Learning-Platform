'use client';

import React, { useState } from 'react';
import FooterNavbar from '../../components/FooterNavbar';
import Link from 'next/link';
import { 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Paintbrush, 
  Code, 
  ClipboardCheck, 
  ArrowRight,
  LifeBuoy
} from 'lucide-react';

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How do I access my purchased courses?',
      a: (
        <span>
          Once your payment transaction completes, navigate directly to the{' '}
          <Link href="/my-courses" className="text-brand-purple hover:underline font-bold">
            Learning Section
          </Link>{' '}
          linked in the top header. You will find all your enrolled courses there, ready to watch instantly.
        </span>
      )
    },
    {
      q: 'Why does my course details page fail to load?',
      a: 'This issue was caused by Hibernate lazy-initialization errors which have been successfully resolved by Nirav! All course pages now load dynamically in less than 50 milliseconds.'
    },
    {
      q: 'How do I skip/seek inside the video player?',
      a: 'You can interactively click anywhere along the horizontal purple seek progress bar at the bottom of the video player, or use the Left/Right Arrow keys to scrub backward or forward by 5 seconds.'
    },
    {
      q: 'How does automatic course completion work?',
      a: 'Course completion triggers automatically as you watch lectures. If you want to manually complete a video, simply click the play/circle checkbox icon in the Course Content sidebar next to the lecture name.'
    },
    {
      q: 'What is the currency of course prices?',
      a: 'All course prices are displayed in Indian Rupees (₹), ranging from ₹600 to ₹3,000, representing scaled course values matching industry rates.'
    },
    {
      q: 'How does progress watch-tracking save network bandwidth?',
      a: 'We cache student watch ticks in a Redis hash buffer and maintain dirty user IDs. A scheduled Spring Boot cron flushes progress state to PostgreSQL in batches every 5 minutes, saving database write connection overhead.'
    },
    {
      q: 'What video quality resolutions are supported?',
      a: 'Uploaded videos are asynchronously transcoded into HLS (HTTP Live Streaming) playlists containing 10-second segments. The player automatically switches between 240p, 360p, 480p, and 720p streams depending on your active internet speed.'
    }
  ];

  const supportTeam = [
    {
      name: 'NIRAV MATHUKIYA',
      role: 'Lead Architect & Escalations',
      icon: <Terminal className="w-5 h-5 text-brand-purple" />,
      desc: 'Manages Spring Boot system health, relational indexing, and Redis progress queue schedules.'
    },
    {
      name: 'KUNJ PATEL',
      role: 'UI & Frontend Support',
      icon: <Paintbrush className="w-5 h-5 text-[#eb8a2f]" />,
      desc: 'Resolves browser CSS rendering bugs, component theme states, and responsive layout wraps.'
    },
    {
      name: 'VATSAL MAKAWANA',
      role: 'Security & Database Desk',
      icon: <Code className="w-5 h-5 text-[#1e6055]" />,
      desc: 'Maintains JPA mappings, JWT credentials validation, and security role routing overrides.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-charcoal">
      {/* Sub-nav menu */}
      <FooterNavbar />

      {/* Split layout: Help Image on Left, FAQs on Right */}
      <section className="max-w-6xl mx-auto w-full py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        
        {/* Left Image (Professional Male Coordinator Swap) */}
        <div className="md:col-span-5 relative h-[420px] w-full rounded overflow-hidden shadow-lg select-none">
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" 
            alt="Technical Support Coordinator" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-purple/15 mix-blend-multiply" />
        </div>

        {/* Right FAQs */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider">
              Help Center
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-charcoal leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Find instant answers to common questions about learning, streaming, and progress tracking on EduFlow.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white border border-brand-grey rounded-[4px] overflow-hidden shadow-sm hover:border-brand-purple/45 transition-colors"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-xs md:text-sm text-brand-charcoal hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-brand-purple" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-500 leading-relaxed border-t border-brand-bg">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EduFlow Support Desk Role Grid (New Section) */}
      <section className="py-16 px-6 bg-white border-t border-b border-brand-grey">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-extrabold uppercase text-brand-purple tracking-wider flex items-center justify-center gap-1.5">
              <LifeBuoy className="w-4 h-4" />
              Support Dispatch
            </span>
            <h2 className="text-2xl font-extrabold text-brand-charcoal">
              Meet the EduFlow Support Desk
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Our core developers stand ready to resolve database connection issues, streaming lags, or purchase claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportTeam.map((member, index) => (
              <div 
                key={index} 
                className="bg-brand-bg p-5 border border-brand-grey hover:border-brand-purple/60 rounded-lg shadow-sm hover:shadow transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="p-2.5 bg-white group-hover:bg-brand-purple/10 rounded-lg w-fit transition-colors border border-brand-grey/40">
                    {member.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">
                      {member.name}
                    </h4>
                    <span className="text-[10px] font-bold text-brand-purple block mt-0.5">
                      {member.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-2.5 leading-relaxed font-medium">
                      {member.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Block */}
      <section className="bg-brand-charcoal text-white py-14 px-6 text-center select-none mt-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-bold text-lg">Still need assistance?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            If you can't find answers in our FAQs, the EduFlow core development team (Nirav, Kunj, and Vatsal) is ready to help you resolve any system, database, or media streaming issues. Get in touch with us directly.
          </p>
          <div className="pt-2">
            <Link href="/contact" className="inline-flex h-[40px] px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-bold text-xs items-center justify-center transition-colors rounded-[4px] cursor-pointer">
              Go to Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
