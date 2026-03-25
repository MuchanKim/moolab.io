'use client';

import { MousePointerClick, Palette, Download, Feather } from 'lucide-react';
import { AppDetailLayout } from '@/components/AppDetailLayout';

export default function SnapDMGPage() {
  return (
    <AppDetailLayout
      appKey="snapdmg"
      iconPath="/apps/snapDMG"
      highlights={[
        { icon: <MousePointerClick size={20} />, titleKey: 'dragDropTitle', bodyKey: 'dragDropBody' },
        { icon: <Palette size={20} />, titleKey: 'customizeTitle', bodyKey: 'customizeBody' },
        { icon: <Download size={20} />, titleKey: 'exportTitle', bodyKey: 'exportBody' },
        { icon: <Feather size={20} />, titleKey: 'lightweightTitle', bodyKey: 'lightweightBody' },
      ]}
      featureKeys={['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
      platform="macOS"
      category="Util"
      version="1.0.0"
      requires="macOS 26 (Tahoe) or later"
      updatedDate="March 2026"
    />
  );
}
