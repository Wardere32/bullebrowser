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
        {product.vendor} is a consulting firm specializing in project
        management, strategic planning, technical assistance for nonprofits
        and government agencies, and grants compliance work. We&apos;ve
        spent the last decade reading RFPs, scanning notices of funding
        opportunity, and writing compliance memoranda — and we built{' '}
        {product.name} for the work we do every day. Its flagship skills —
        grant scanning, RFP comparison, and compliance review — cover the jobs
        we run most often, and the agent takes on the rest on request.
      </p>

      <h2>Why a browser?</h2>
      <p>
        The grant and procurement web is fragmented. SAM.gov, Grants.gov,
        agency portals, state procurement sites — each with its own search
        UI, deadline format, and download flow. An agent that operates a
        real browser, with cookies and session state, can do the actual
        triage work instead of summarizing search results from a stale
        index.
      </p>

      <h2>Why BYOK?</h2>
      <p>
        Our clients work with sensitive procurement information. We do not
        want their drafts, deliberations, or strategy documents flowing
        through our infrastructure. {product.name} routes prompts directly
        from your machine to your AI provider; we never see them.
      </p>

      <h2>Contact</h2>
      <p>
        Press, partnerships, or product feedback:{' '}
        <a href={`mailto:${product.contactEmail}`}>{product.contactEmail}</a>.
      </p>
    </div>
  );
}
