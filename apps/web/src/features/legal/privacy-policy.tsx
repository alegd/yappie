import { PublicNavbar } from "@/components/layout/public-navbar";
import Link from "next/link";

const CONTACT_EMAIL = "ale.gueden@gmail.com";
const ENTITY_NAME = "Alejandro Guedén";
const EFFECTIVE_DATE = "April 13, 2026";

export function PrivacyPolicy() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PublicNavbar />

      <article className="mx-auto px-6 py-16 max-w-3xl prose prose-invert prose-zinc">
        <h1 className="font-heading text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>

        <p>
          Yappie (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is operated by{" "}
          <strong>{ENTITY_NAME}</strong>. This Privacy Policy explains what data we collect, why we
          collect it, how we use it, and your rights regarding that data.
        </p>

        <h2>1. Data We Collect</h2>

        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your <strong>email address</strong>. We use
          passwordless authentication (one-time codes sent to your email).
        </p>

        <h3>Audio Recordings</h3>
        <p>
          You upload or record audio files through Yappie. We store your audio files so you can
          review or re-process them. <strong>You can delete any audio at any time</strong> from your
          dashboard. Once you delete an audio, both the file and its metadata are removed from our
          systems and we do not retain a backup copy.
        </p>

        <h3>Generated Content</h3>
        <p>
          Transcriptions and tickets generated from your audio are stored in your account until you
          delete them or delete your account.
        </p>

        <h3>Payment Information</h3>
        <p>
          If you subscribe to a paid plan, payment is processed by <strong>Stripe, Inc.</strong> We
          store your Stripe customer ID and subscription status. We never store your credit card
          number, CVV, or full payment details — Stripe handles that directly under their{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>

        <h3>Jira Integration</h3>
        <p>
          If you connect your Atlassian account, we store an <strong>encrypted OAuth token</strong>{" "}
          to export tickets on your behalf. We access only the Jira scopes you authorize. You can
          revoke access at any time from your Atlassian account settings.
        </p>

        <h3>Usage Data</h3>
        <p>
          We collect anonymous usage analytics through <strong>Vercel Analytics</strong> and{" "}
          <strong>Umami</strong> (page views, navigation patterns). Umami runs on our own
          infrastructure at <code>umami.gueden.com</code>, is cookie-less, does not collect any
          personally identifiable information, and does not track you across other websites. We use{" "}
          <strong>Sentry</strong> for error monitoring, which may capture technical metadata
          (browser, OS, stack traces) when errors occur.
        </p>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>To provide the core service: transcribe audio and generate tickets.</li>
          <li>To authenticate you and manage your account.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To export tickets to Jira on your behalf.</li>
          <li>To monitor errors and improve service reliability.</li>
          <li>To send transactional emails (login codes, account notifications).</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data, use it for advertising, or share it with third
          parties for marketing purposes.
        </p>

        <h2>3. Third-Party Services</h2>
        <p>We share data with the following services, strictly to operate Yappie:</p>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Purpose</th>
              <th>Data shared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OpenAI</td>
              <td>Audio transcription &amp; task decomposition</td>
              <td>Audio files, transcription text</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Payment processing</td>
              <td>Email, subscription events</td>
            </tr>
            <tr>
              <td>Atlassian (Jira)</td>
              <td>Ticket export</td>
              <td>Ticket data you choose to export</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Transactional emails</td>
              <td>Email address</td>
            </tr>
            <tr>
              <td>Sentry</td>
              <td>Error monitoring</td>
              <td>Technical error metadata</td>
            </tr>
            <tr>
              <td>Vercel Analytics</td>
              <td>Usage analytics</td>
              <td>Anonymous page view data</td>
            </tr>
            <tr>
              <td>Umami (self-hosted)</td>
              <td>Usage analytics</td>
              <td>Anonymous page view data (no cookies, no PII)</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Data Retention</h2>
        <ul>
          <li>
            <strong>Audio files:</strong> Retained until you delete them from your dashboard or
            delete your account. We do not retain backups after deletion.
          </li>
          <li>
            <strong>Transcriptions &amp; tickets:</strong> Retained until you delete the underlying
            audio, delete them individually, or delete your account. Tickets already exported to
            Jira continue to live in your Atlassian workspace — deletion in Yappie does not remove
            them from Jira.
          </li>
          <li>
            <strong>Account data:</strong> Retained while your account is active. Deleted upon
            account deletion request.
          </li>
          <li>
            <strong>Jira tokens:</strong> Encrypted at rest. Deleted when you disconnect the
            integration or delete your account.
          </li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We use industry-standard measures to protect your data, including HTTPS encryption in
          transit, AES-256 encryption for sensitive tokens at rest, secure password hashing, and
          role-based access controls. However, no system is 100% secure — we cannot guarantee
          absolute security.
        </p>

        <h2>6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
          <li>Export your data in a portable format.</li>
          <li>Withdraw consent for optional data processing.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2>7. Cookies</h2>
        <p>
          Yappie uses only <strong>essential cookies</strong> for authentication (session tokens).
          We do not use tracking cookies, advertising cookies, or third-party cookie-based
          analytics.
        </p>

        <h2>8. Children</h2>
        <p>
          Yappie is not directed at children under 16. We do not knowingly collect data from
          children. If you believe a child has provided us with personal data, please contact us and
          we will delete it.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by posting a notice on our website. Your continued use of Yappie after changes
          constitutes acceptance of the updated policy.
        </p>

        <h2>10. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </article>

      <footer className="px-6 py-8 border-border border-t">
        <div className="flex justify-between items-center mx-auto max-w-6xl text-muted-foreground text-sm">
          <span>Yappie</span>
          <Link href="/" className="hover:text-foreground transition">
            Back to home
          </Link>
        </div>
      </footer>
    </main>
  );
}
