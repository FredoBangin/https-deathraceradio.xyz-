import React from 'react';

export const Terms: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>Terms of Service</h1>
      <p>Last updated: July 2, 2026</p>
    </header>

    <section className="static-section">
      <h2>Acceptance</h2>
      <p>
        By accessing deathraceradio.xyz you agree to these terms. If you do not agree, do not use
        the site.
      </p>
    </section>

    <section className="static-section">
      <h2>Use of the site</h2>
      <p>
        Death Race Radio is a fan-made archive provided for personal, non-commercial listening and
        research purposes only. You may not:
      </p>
      <ul>
        <li>Redistribute or re-host any audio files from this site.</li>
        <li>Use this site for commercial purposes.</li>
        <li>Attempt to scrape, crawl, or mirror the site's content at scale.</li>
        <li>Circumvent any technical restrictions.</li>
      </ul>
    </section>

    <section className="static-section">
      <h2>Intellectual property</h2>
      <p>
        All music on this site is the property of the Juice WRLD estate, Grade A Productions,
        Interscope Records, and/or respective rights holders. Death Race Radio claims no ownership
        of any audio content. The site's source code is licensed under the MIT License.
      </p>
    </section>

    <section className="static-section">
      <h2>User accounts</h2>
      <p>
        You are responsible for maintaining the security of your account credentials. We reserve the
        right to suspend or terminate accounts that violate these terms.
      </p>
    </section>

    <section className="static-section">
      <h2>Disclaimer of warranties</h2>
      <p>
        The site is provided "as is" without warranty of any kind. We do not guarantee uninterrupted
        access, audio availability, or accuracy of track metadata.
      </p>
    </section>

    <section className="static-section">
      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Death Race Radio shall not be liable for any indirect,
        incidental, or consequential damages arising from your use of the site.
      </p>
    </section>

    <section className="static-section">
      <h2>Changes</h2>
      <p>
        We may update these terms at any time. Continued use of the site after changes constitutes
        acceptance of the new terms.
      </p>
    </section>

    <section className="static-section">
      <h2>Contact</h2>
      <p>
        <a href="mailto:contact@deathraceradio.xyz">contact@deathraceradio.xyz</a>
      </p>
    </section>
  </div>
);

export default Terms;
