'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FooterNavbar() {
  const pathname = usePathname();

  const links = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help & Support', href: '/help' },
    { name: 'Terms of Use', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' }
  ];

  return (
    <div className="w-full bg-brand-white border-b border-brand-grey sticky top-[56px] z-40 select-none">
      <div className="max-w-6xl mx-auto px-4 md:px-12 h-[48px] flex items-center justify-between gap-4">
        {/* Brand/Subtitle */}
        <span className="text-xs font-extrabold uppercase tracking-widest text-brand-purple shrink-0 hidden sm:block">
          Corporate Center
        </span>

        {/* Sub-navbar Links */}
        <nav className="flex items-center gap-5 md:gap-8 h-full overflow-x-auto w-full sm:w-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center text-xs font-bold transition-all relative border-b-2 whitespace-nowrap shrink-0 ${
                  isActive 
                    ? 'border-brand-purple text-brand-purple' 
                    : 'border-transparent text-brand-charcoal hover:text-brand-purple'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
