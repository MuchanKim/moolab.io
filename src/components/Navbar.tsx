'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';

function MoolabLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="26" height="24" viewBox="0 0 36 34" fill="none" aria-hidden>
        <circle cx="18" cy="11" r="11" fill="#6FBB74" />
        <circle cx="9"  cy="25" r="11" fill="#6FBB74" />
        <circle cx="27" cy="25" r="11" fill="#6FBB74" />
      </svg>
      <span className="text-[1.1rem] font-semibold tracking-tight text-[#1a1a1a]">
        moolab
      </span>
    </div>
  );
}

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const next = locale === 'ko' ? 'en' : 'ko';

  return (
    <button
      onClick={() => router.replace(pathname, { locale: next })}
      className="text-xs font-medium tracking-widest text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors cursor-pointer uppercase"
    >
      {next}
    </button>
  );
}

const NAV_LINKS = ['about', 'news', 'apps', 'shop'] as const;

export function Navbar() {
  const t = useTranslations('nav');
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 20);
  });

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #e8e8e8' : '1px solid transparent',
      }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <MoolabLogo />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((key) => (
            <li key={key}>
              <Link
                href={key === 'about' ? '/' : '#'}
                className="relative text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors group"
              >
                {t(key)}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#6FBB74] transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
        </ul>

        <LanguageSwitcher />
      </nav>
    </motion.header>
  );
}
