import type { Metadata } from 'next';
import { product } from '@bullebrowser/brand-tokens';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${product.vendor} and ${product.name}.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose-lite">
      <h1 className="text-4xl font-bold">About {product.vendor}</h1>
      <p>
        {product.vendor} builds browser products and automation workflows. We
        built {product.name} to be a general-purpose agentic browser that can
        read pages, navigate sites, and complete tasks in a live browser for
        the work we do every day and the work our users ask of it.
      </p>

      <h2>Why a browser?</h2>
      <p>
        The web is fragmented. Modern sites use their own controls, layouts,
        authentication, and task flows. An agent that operates a real browser,
        with cookies and session state, can do the actual work instead of
        summarizing a stale index.
      </p>

      <h2>Why BYOK?</h2>
      <p>
        Our users work with sensitive information. We do not want their drafts,
        deliberations, or strategy documents flowing through our infrastructure.
        {product.name} routes prompts directly from your machine to your AI
        provider; we never see them.
      </p>

      <h2>Contact</h2>
      <p>
        Press, partnerships, or product feedback:{' '}
        <a href={`mailto:${product.contactEmail}`}>{product.contactEmail}</a>.
      </p>
    </div>
  );
}
