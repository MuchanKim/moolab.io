'use client';

import { Sparkles, LayoutGrid, Monitor, ShieldCheck } from 'lucide-react';
import { AppDetailLayout } from '@/components/AppDetailLayout';

export default function GitivityPage() {
  return (
    <AppDetailLayout
      appKey="gitivity"
      iconPath="/apps/gitivity"
      highlights={[
        { icon: <Sparkles size={20} />, titleKey: 'insightsTitle', bodyKey: 'insightsBody' },
        { icon: <LayoutGrid size={20} />, titleKey: 'widgetsTitle', bodyKey: 'widgetsBody' },
        { icon: <Monitor size={20} />, titleKey: 'crossPlatformTitle', bodyKey: 'crossPlatformBody' },
        { icon: <ShieldCheck size={20} />, titleKey: 'privacyTitle', bodyKey: 'privacyBody' },
      ]}
      featureKeys={['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
      platform="iOS · iPadOS · macOS"
      category="Productivity"
      version="—"
      requires="iOS 18 / macOS 15 or later"
      updatedDate="Coming Soon"
    />
  );
}
