import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CursorProvider } from '@/components/effects/CursorProvider';
import PullCord from '@/components/PullCord';
import '../globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'Moolab',
  description: 'Probably building something right now.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Moolab',
    description: 'Probably building something right now.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moolab',
    description: 'Probably building something right now.',
    images: ['/og-image.jpg'],
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={geist.variable} data-theme="light" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <CursorProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
            {/* PullCord removed — theme toggle moved to Navbar */}
          </CursorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
