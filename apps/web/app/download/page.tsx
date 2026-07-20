'use client';

import Image from 'next/image';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadTable } from '@/components/DownloadTable';
import { asset } from '@/lib/asset';
import { useT } from '@/lib/i18n';

export default function DownloadPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-line bg-surface-muted px-4 py-2">
        <Image src={asset('/wordmark.png')} alt={product.name} width={178} height={60} />
        <span className="text-xs text-ink-secondary">{t('download.badge')}</span>
      </div>
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
