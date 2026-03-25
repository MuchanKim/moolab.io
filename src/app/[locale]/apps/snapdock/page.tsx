'use client';

import { Zap, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { AppDetailLayout } from '@/components/AppDetailLayout';

export default function SnapDockPage() {
  return (
    <AppDetailLayout
      appKey="snapdock"
      iconPath="/apps/snapdock"
      highlights={[
        { icon: <Zap size={20} />, titleKey: 'instantAccessTitle', bodyKey: 'instantAccessBody' },
        { icon: <Target size={20} />, titleKey: 'organizeTitle', bodyKey: 'organizeBody' },
        { icon: <Sparkles size={20} />, titleKey: 'designTitle', bodyKey: 'designBody' },
        { icon: <ShieldCheck size={20} />, titleKey: 'privacyTitle', bodyKey: 'privacyBody' },
      ]}
      featureKeys={['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
      downloadUrl="/apps/snapdock/SnapDock_v1.0.0.dmg"
      privacyUrl="/apps/snapdock/privacy"
      supportUrl="/apps/snapdock/support"
      platform="macOS"
      category="Util"
      version="1.0.0"
      requires="macOS 26 (Tahoe) or later"
      updatedDate="March 2026"
      versionHistory={[
        {
          version: '1.0.0',
          date: 'March 25, 2026',
          changes: [
            'Initial release',
            'Customizable keyboard shortcut',
            'Horizontal and vertical dock orientation',
            'Launch at login support',
            'Built with Apple Liquid Glass design',
          ],
        },
      ]}
    />
  );
}
