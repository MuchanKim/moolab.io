'use client';

import { useLocale } from 'next-intl';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTheme } from './ThemeProvider';
import { useNeuronGlow } from '@/contexts/NeuronGlowContext';

// ─── 수치값·수식은 여기서만 관리 ──────────────────────────────────────────────
const NAV_CONFIG = {
  logo: {
    height: '40px',
  },
  link: {
    fontSize: '15px',
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

// ─── 나뭇잎 path 데이터 ────────────────────────────────────────────────────
const LEAF_PATHS = [
  'M58.8608 25.2097C41.3334 50.2558 16.7931 107.135 58.8589 134.281C79.4341 121.354 108.241 81.4421 58.8608 25.2097Z',
  'M126.29 67.827C99.0532 63.2988 38.3469 68.8622 40.9748 126.658C61.1024 140.834 111.856 148.777 126.29 67.827Z',
  'M72.5409 135.762C73.6427 112.895 70.6916 74.5018 37.0003 87C29.8452 105.841 24.3217 138.599 72.5409 135.762Z',
  'M8.92621 69.3939C9.94926 92.818 25.561 129.104 54.0007 134.5C58.6328 118.636 50.9383 92.9331 8.92621 69.3939Z',
];

// ─── 텍스트 path 데이터 ────────────────────────────────────────────────────
const TEXT_PATHS = [
  'M325.469 139.547C302.406 139.547 288.062 123.656 288.062 100.031C288.062 76.4062 302.406 60.6562 325.469 60.6562C348.531 60.6562 363.016 76.4062 363.016 100.031C363.016 123.656 348.531 139.547 325.469 139.547ZM325.609 123.375C336.297 123.375 341.781 113.391 341.781 100.031C341.781 86.5312 336.297 76.5469 325.609 76.5469C314.781 76.5469 309.156 86.5312 309.156 100.031C309.156 113.391 314.781 123.375 325.609 123.375Z',
  'M395.469 139.547C372.406 139.547 358.062 123.656 358.062 100.031C358.062 76.4062 372.406 60.6562 395.469 60.6562C418.531 60.6562 433.016 76.4062 433.016 100.031C433.016 123.656 418.531 139.547 395.469 139.547ZM395.609 123.375C406.297 123.375 411.781 113.391 411.781 100.031C411.781 86.5312 406.297 76.5469 395.609 76.5469C384.781 76.5469 379.156 86.5312 379.156 100.031C379.156 113.391 384.781 123.375 395.609 123.375Z',
  'M458.969 36.1875V138H438.156V36.1875H458.969ZM464.284 116.625C464.284 99.6094 478.066 93.9844 492.691 93.1406C498.175 92.7891 508.441 92.2969 511.675 92.1562V85.9688C511.534 79.6406 507.175 75.8438 499.441 75.8438C492.409 75.8438 487.909 79.0781 486.784 84.2812H466.956C468.222 71.0625 479.753 60.6562 500.003 60.6562C516.597 60.6562 532.347 68.1094 532.347 86.5312V138H512.659V127.453H512.097C508.3 134.484 501.128 139.406 489.737 139.406C475.112 139.406 464.284 131.812 464.284 116.625ZM484.253 116.062C484.253 121.969 489.034 125.062 495.644 125.062C505.066 125.062 511.816 118.734 511.675 110.719V105.094C508.511 105.234 499.652 105.727 496.066 106.078C488.894 106.781 484.253 110.156 484.253 116.062ZM541.459 138V36.1875H562.272V74.4375H562.834C565.787 68.25 571.834 60.6562 584.631 60.6562C601.506 60.6562 615.709 73.7344 615.709 99.8906C615.709 125.344 602.069 139.266 584.631 139.266C572.116 139.266 565.787 132.094 562.834 125.766H561.991V138H541.459ZM561.85 99.75C561.85 113.531 567.756 122.672 578.022 122.672C588.709 122.672 594.334 113.25 594.334 99.75C594.334 86.3906 588.709 77.25 578.022 77.25C567.616 77.25 561.85 85.9688 561.85 99.75Z',
  'M258.641 60.6562C272.844 60.6562 282.688 70.0781 282.688 86.6719V138H261.875V90.75C261.875 82.0312 256.812 77.8125 249.922 77.8125C242.047 77.8125 237.547 83.2969 237.547 91.3125V138H217.297V90.1875C217.297 82.5938 212.516 77.8125 205.484 77.8125C198.453 77.8125 192.969 83.4375 192.969 92.1562V138H172.156V75H192.828C196.062 66.1406 203.797 60.6562 214.062 60.6562C224.609 60.6562 232.344 66.1406 234.875 75H235.578C238.812 66.2812 247.391 60.6562 258.641 60.6562Z',
  'M172 50H192V66H172V50Z',
];

function MoolabLogo() {
  const { theme } = useTheme();
  const textFill = theme === 'dark' ? '#F5F5F5' : '#252525';

  return (
    <svg
      width="450" height="112" viewBox="168 30 450 112" fill="none"
      style={{ height: '22px', width: 'auto', cursor: 'pointer' }}
      aria-label="moolab"
    >
      {TEXT_PATHS.map((d, i) => (
        <path key={i} d={d} fill={textFill} />
      ))}
    </svg>
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
        aria-label="Switch language"
        className="flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase cursor-pointer transition-opacity duration-200 hover:opacity-70 dark:text-[rgba(255,255,255,0.55)] text-[rgba(0,0,0,0.45)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        {options.find((o) => o.value === locale)?.short}
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
  const { theme, toggle } = useTheme();

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

          {/* 테마 토글 */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-70"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" stroke="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(0,0,0,0.45)" stroke="none">
                <circle cx="12" cy="12" r="5"/><rect x="11" y="0.5" width="2" height="3" rx="1"/><rect x="11" y="20.5" width="2" height="3" rx="1"/><rect x="3.4" y="3.93" width="2" height="3" rx="1" transform="rotate(-45 4.4 5.43)"/><rect x="17.53" y="18.07" width="2" height="3" rx="1" transform="rotate(-45 18.53 19.57)"/><rect x="0.5" y="11" width="3" height="2" rx="1"/><rect x="20.5" y="11" width="3" height="2" rx="1"/><rect x="3.93" y="17.53" width="3" height="2" rx="1" transform="rotate(-45 5.43 18.53)"/><rect x="18.07" y="3.4" width="3" height="2" rx="1" transform="rotate(-45 19.57 4.4)"/>
              </svg>
            )}
          </button>
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
  const { theme, toggle } = useTheme();

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

          {/* 데스크탑: 우측 (탭 + 구분선 + 언어 + 테마) */}
          <div className="hidden items-center md:flex" style={{ gap: NAV_CONFIG.rightBar.gap }}>
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <NavLink href={href}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* 구분선 — 넓은 간격 + 진하게 */}
            <div className="h-5 w-px dark:bg-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.12)] mx-3" />

            <LanguageSwitcher />

            {/* 테마 토글 — naked icon */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-70"
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" stroke="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(0,0,0,0.45)" stroke="none">
                  <circle cx="12" cy="12" r="5"/><rect x="11" y="0.5" width="2" height="3" rx="1"/><rect x="11" y="20.5" width="2" height="3" rx="1"/><rect x="3.4" y="3.93" width="2" height="3" rx="1" transform="rotate(-45 4.4 5.43)"/><rect x="17.53" y="18.07" width="2" height="3" rx="1" transform="rotate(-45 18.53 19.57)"/><rect x="0.5" y="11" width="3" height="2" rx="1"/><rect x="20.5" y="11" width="3" height="2" rx="1"/><rect x="3.93" y="17.53" width="3" height="2" rx="1" transform="rotate(-45 5.43 18.53)"/><rect x="18.07" y="3.4" width="3" height="2" rx="1" transform="rotate(-45 19.57 4.4)"/>
                </svg>
              )}
            </button>
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
