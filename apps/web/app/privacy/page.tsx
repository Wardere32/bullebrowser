import type { Metadata } from 'next';
import { product } from '@bullebrowser/brand-tokens';

export const metadata: Metadata = {
  title: 'Privacy',
  description: `${product.name} privacy policy.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose-lite">
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <p className="text-ink-secondary">Effective date: 2026-01-01.</p>

      <h2>Plain-language summary</h2>
      <p>
        {product.name} is bring-your-own-key. Your prompts and tool
        outputs go directly from your computer to the AI provider you
        configure. Nothing is routed through{' '}
        {product.vendor} servers. We have no analytics or telemetry in v1.
      </p>

      <h2>Data {product.vendor} collects</h2>
      <p>None from the desktop app.</p>
      <p>
        This website ({product.domain}) is a static site hosted on GitHub
        Pages and may receive standard server access logs (IP, user agent,
        requested path) as part of normal HTTP serving. The download page
        also calls the public GitHub Releases API from your browser to
        list the latest installers. We do not run any analytics scripts.
      </p>

      <h2>Data stored on your device</h2>
      <ul>
        <li>
          <strong>API keys.</strong> Encrypted via your operating system&apos;s
          keychain (Keychain on macOS, libsecret on Linux, DPAPI on Windows).
          Never written to disk in plaintext.
        </li>
        <li>
          <strong>Browsing history</strong> and <strong>bookmarks</strong>,
          stored in the standard {product.name} user-data directory for
          your operating system.
        </li>
        <li>
          <strong>Agent conversations</strong>, stored locally so you can
          revisit and continue them.
        </li>
        <li>
          <strong>App settings</strong>, including your default model and
          compliance checklist.
        </li>
      </ul>
      <p>
        You can clear browsing history and remove your API key from the
        Settings page at any time.
      </p>

      <h2>Data sent to third parties</h2>
      <p>
        When you submit a prompt to the AI panel, the renderer hands it to
        the main process, which calls your configured provider API directly
        from your machine using the API key you configured. The text of
        your prompt, your conversation history, and the contents of any
        web pages the agent reads on your behalf are sent under that
        provider&apos;s terms and privacy policy.
      </p>
      <p>
        When the agent navigates to a website, that website may set
        cookies and receive your network requests just as in any other
        browser. {product.name} does not modify or proxy that traffic.
      </p>

      <h2>Updates</h2>
      <p>
        Future versions of {product.name} may add optional features that
        share data with additional providers (other LLMs, sync, etc.). Any
        such feature will be opt-in and clearly disclosed in the release
        notes and on this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${product.contactEmail}`}>{product.contactEmail}</a>.
      </p>
    </div>
  );
}
