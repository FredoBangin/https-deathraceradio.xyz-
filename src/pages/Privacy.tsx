import React from 'react';

export const Privacy: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2, 2026</p>
    </header>

    <section className="static-section">
      <h2>Overview</h2>
      <p>
        Death Race Radio ("we", "us", "our") operates deathraceradio.xyz. This policy describes what
        data we collect, how we use it, and your rights.
      </p>
    </section>

    <section className="static-section">
      <h2>Data we collect</h2>
      <h3>Account data</h3>
      <p>
        If you create an account, we store your email address and a hashed password via Supabase Auth.
        We do not store payment information.
      </p>
      <h3>Usage data</h3>
      <p>
        We use Plausible Analytics, a privacy-respecting analytics tool that collects no personally
        identifiable information and uses no cookies. Aggregate data such as page views and referral
        sources may be collected.
      </p>
      <h3>Locally stored data</h3>
      <p>
        Your recently played tracks and player volume preference are stored in your browser's local
        storage. This data never leaves your device unless you are signed in, in which case liked
        tracks are synced to our database.
      </p>
    </section>

    <section className="static-section">
      <h2>Third-party services</h2>
      <ul>
        <li><strong>Supabase</strong> — database and authentication. <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Privacy policy</a>.</li>
        <li><strong>juicewrldapi.com</strong> — audio and metadata source.</li>
        <li><strong>Plausible Analytics</strong> — cookieless analytics. <a href="https://plausible.io/privacy" target="_blank" rel="noreferrer">Privacy policy</a>.</li>
        <li><strong>Vercel</strong> — hosting. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Privacy policy</a>.</li>
      </ul>
    </section>

    <section className="static-section">
      <h2>Data retention</h2>
      <p>
        Account data is retained until you delete your account. You may request deletion at any time by
        contacting us at <a href="mailto:contact@deathraceradio.xyz">contact@deathraceradio.xyz</a>.
      </p>
    </section>

    <section className="static-section">
      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:contact@deathraceradio.xyz">contact@deathraceradio.xyz</a>.
      </p>
    </section>
  </div>
);

export default Privacy;
