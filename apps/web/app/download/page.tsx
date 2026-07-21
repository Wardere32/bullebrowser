'use client';

import { product } from '@bullebrowser/brand-tokens';
import { DownloadTable } from '@/components/DownloadTable';
import { useT } from '@/lib/i18n';

export default function DownloadPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">{t('download.h1')} {product.name}</h1>
      <p className="mt-2 text-ink-secondary">
        {t('download.sub')}
      </p>
      <DownloadTable />
      <p className="mt-6 text-xs text-ink-secondary">
        {t('download.signed')}
      </p>
    </div>
  );
}
