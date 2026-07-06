import type { Metadata } from 'next';
import Image from 'next/image';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadTable } from '@/components/DownloadTable';
import { asset } from '@/lib/asset';

export const metadata: Metadata = {
  title: 'Download',
  description: `Download ${product.name} for macOS, Windows, or Linux.`,
};

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-line bg-surface-muted px-4 py-2">
        <Image src={asset('/wordmark.png')} alt={product.name} width={160} height={28} />
        <span className="text-xs text-ink-secondary">Official BulleBrowser downloads</span>
      </div>
      <h1 className="text-3xl font-bold">Download {product.name}</h1>
      <p className="mt-2 text-ink-secondary">
        Every installer here is tied to the current BulleBrowser release channel and includes the
        in-browser Agentic AI experience.
      </p>
      <DownloadTable />
      <p className="mt-6 text-xs text-ink-secondary">
        Verify the SHA-256 of your download against checksums.txt before
        installing. Releases are signed by BulleBrowser on macOS and
        Windows.
      </p>
    </div>
  );
}
