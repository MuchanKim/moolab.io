'use client';

import { useLocale } from 'next-intl';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTheme } from './ThemeProvider';

// ─── 수치값·수식은 여기서만 관리 ──────────────────────────────────────────────
const NAV_CONFIG = {
  logo: {
    height: '40px',
  },
  link: {
    fontSize: '17px',
    padding: '7px 20px',
    borderRadius: '9999px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  dropdown: {
    containerRadius: '12px',
    containerPadding: '4px',
    minWidth: '80px',
    marginTop: '8px',
    itemRadius: '8px',
    itemPadding: '6px 14px',
    itemFontSize: '12px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  langSwitcher: {
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '9999px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  rightBar: {
    gap: '12px',
  },
  topOffset: '0px',
  scroll: {
    threshold: 20,
    blur: '12px',
    bgDark: 'rgba(17,18,20,0.72)',
    bgLight: 'rgba(245,245,245,0.72)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  animation: {
    duration: 0.35,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  },
} as const;

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
// ──────────────────────────────────────────────────────────────────────────────

function MoolabLogo() {
  const { theme } = useTheme();

  return (
    <img
      src={theme === 'dark' ? '/moolab_Image_dark.svg' : '/moolab_Image_light.svg'}
      alt="moolab"
      style={{ height: NAV_CONFIG.logo.height, width: 'auto', cursor: 'pointer' }}
      draggable={false}
    />
  );
}

function ThemeIcon() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={isDark ? 'none' : 'currentColor'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}

function DarkModeToggle() {
  const { toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 text-foreground hover:opacity-60 transition-opacity cursor-pointer"
      aria-label="Toggle dark mode"
    >
      <ThemeIcon />
    </button>
  );
}

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const options = [
    { short: 'KO', label: '한국어', value: 'ko' },
    { short: 'EN', label: 'English (US)', value: 'en' },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: NAV_CONFIG.langSwitcher.padding,
          borderRadius: NAV_CONFIG.langSwitcher.borderRadius,
          fontSize: NAV_CONFIG.langSwitcher.fontSize,
          fontWeight: open ? 600 : 400,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: open ? 'var(--foreground)' : 'var(--muted)',
          backgroundColor: open ? 'var(--nav-hover)' : 'transparent',
          transition: NAV_CONFIG.langSwitcher.transition,
          cursor: 'pointer',
        }}
      >
        {options.find((o) => o.value === locale)?.short}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: NAV_CONFIG.dropdown.marginTop,
              borderRadius: NAV_CONFIG.dropdown.containerRadius,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              padding: NAV_CONFIG.dropdown.containerPadding,
              minWidth: NAV_CONFIG.dropdown.minWidth,
              boxShadow: 'var(--dropdown-shadow)',
            }}
          >
            {options.map(({ label, value }) => (
              <DropdownItem
                key={value}
                label={label}
                active={value === locale}
                onClick={() => { router.replace(pathname, { locale: value }); setOpen(false); }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        borderRadius: NAV_CONFIG.dropdown.itemRadius,
        padding: NAV_CONFIG.dropdown.itemPadding,
        fontSize: NAV_CONFIG.dropdown.itemFontSize,
        fontWeight: active ? 600 : 400,
        textAlign: 'left',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: active ? 'var(--foreground)' : 'var(--muted)',
        backgroundColor: hovered ? 'var(--nav-hover)' : 'transparent',
        transition: NAV_CONFIG.dropdown.transition,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        borderRadius: NAV_CONFIG.link.borderRadius,
        padding: NAV_CONFIG.link.padding,
        fontSize: NAV_CONFIG.link.fontSize,
        fontWeight: hovered ? 600 : 400,
        color: hovered ? 'var(--foreground)' : 'var(--muted)',
        backgroundColor: hovered ? 'var(--nav-hover)' : 'transparent',
        transition: NAV_CONFIG.link.transition,
      }}
    >
      {/* bold 기준 너비를 미리 확보 — 레이아웃 밀림 방지 */}
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, visibility: 'hidden', height: 0, pointerEvents: 'none' }}>
          {children}
        </span>
        <span>{children}</span>
      </span>
    </Link>
  );
}

// ─── 햄버거 아이콘 (열기/닫기 애니메이션) ────────────────────────────────────
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <motion.line
        x1="3" x2="17"
        animate={isOpen ? { y1: 10, y2: 10, rotate: 45 } : { y1: 5, y2: 5, rotate: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ transformOrigin: 'center' }}
      />
      <motion.line
        x1="3" y1="10" x2="17" y2="10"
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.line
        x1="3" x2="17"
        animate={isOpen ? { y1: 10, y2: 10, rotate: -45 } : { y1: 15, y2: 15, rotate: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

// ─── 모바일 메뉴 오버레이 ────────────────────────────────────────────────────
function MobileMenu({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const langOptions = [
    { short: 'KO', label: '한국어', value: 'ko' },
    { short: 'EN', label: 'English (US)', value: 'en' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 배경 백드롭 */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(17,18,20,0.85)' : 'rgba(245,245,245,0.85)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* 메뉴 콘텐츠 */}
      <motion.nav
        className="relative flex flex-col items-center justify-center h-full gap-2 px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
      >
        {/* 네비게이션 링크 */}
        {NAV_LINKS.map(({ label, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.08 + i * 0.05 }}
          >
            <Link
              href={href}
              onClick={onClose}
              className="block py-3 text-center text-2xl font-medium text-foreground hover:text-accent transition-colors"
            >
              {label}
            </Link>
          </motion.div>
        ))}

        {/* 구분선 */}
        <motion.div
          className="my-4 h-px w-16 bg-border"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
        />

        {/* 하단 컨트롤: 다크모드 + 언어 */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex gap-2">
            {langOptions.map(({ short, value }) => (
              <button
                key={value}
                onClick={() => { router.replace(pathname, { locale: value }); onClose(); }}
                className="px-3 py-1.5 text-xs font-medium tracking-widest uppercase rounded-full transition-colors cursor-pointer"
                style={{
                  color: value === locale ? 'var(--foreground)' : 'var(--muted)',
                  backgroundColor: value === locale ? 'var(--nav-hover)' : 'transparent',
                  fontWeight: value === locale ? 600 : 400,
                }}
              >
                {short}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.nav>
    </motion.div>
  );
}

// 네비게이션 탭은 언어와 무관하게 항상 영어
const NAV_LINKS = [
  { label: 'About',  href: '/about' },
  { label: 'Apps',   href: '/apps' },
  { label: 'Store',  href: '/store' },
] as const;

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevScrollY = useRef(0);
  const { theme } = useTheme();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    prevScrollY.current = window.scrollY;
  }, []);

  // ESC 키로 모바일 메뉴 닫기
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobile(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, closeMobile]);

  // 모바일 메뉴 열림 시 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useMotionValueEvent(scrollY, 'change', (v) => {
    if (mobileOpen) return;
    const diff = v - prevScrollY.current;
    if (v > NAV_CONFIG.scroll.threshold) {
      setScrolled(true);
      setHidden(diff > 0);
    } else {
      setScrolled(false);
      setHidden(false);
    }
    prevScrollY.current = v;
  });

  const bgColor = scrolled
    ? theme === 'dark'
      ? NAV_CONFIG.scroll.bgDark
      : NAV_CONFIG.scroll.bgLight
    : 'rgba(0,0,0,0)';

  return (
    <>
      <motion.header
        className="fixed left-0 right-0 z-50"
        initial={{ y: 0 }}
        animate={{ y: hidden && !mobileOpen ? '-100%' : 0 }}
        transition={{ duration: NAV_CONFIG.animation.duration, ease: NAV_CONFIG.animation.ease }}
        style={{
          top: NAV_CONFIG.topOffset,
          backgroundColor: mobileOpen ? 'transparent' : bgColor,
          backdropFilter: scrolled && !mobileOpen ? `blur(${NAV_CONFIG.scroll.blur})` : 'none',
          borderBottom: scrolled && !mobileOpen ? '1px solid var(--border)' : '1px solid transparent',
          transition: NAV_CONFIG.scroll.transition,
        }}
      >
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5 md:px-12">

          {/* 로고 */}
          <a href="/" className="cursor-pointer relative z-50">
            <MoolabLogo />
          </a>

          {/* 데스크탑: 중앙 탭 */}
          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <NavLink href={href}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* 데스크탑: 우측 컨트롤 */}
          <div className="hidden items-center md:flex" style={{ gap: NAV_CONFIG.rightBar.gap }}>
            <LanguageSwitcher />
          </div>

          {/* 모바일: 햄버거 버튼 */}
          <button
            className="relative z-50 flex items-center justify-center w-10 h-10 text-foreground md:hidden cursor-pointer"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon isOpen={mobileOpen} />
          </button>

        </nav>
      </motion.header>

      {/* 모바일 메뉴 오버레이 */}
      <AnimatePresence>
        {mobileOpen && <MobileMenu onClose={closeMobile} />}
      </AnimatePresence>
    </>
  );
}
