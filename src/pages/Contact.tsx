import React from 'react';

export const Contact: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>Contact</h1>
      <p>Get in touch for bugs, track submissions, or rights concerns.</p>
    </header>

    <section className="static-section">
      <h2>General & bugs</h2>
      <p>
        For bug reports and general feedback, open an issue on{' '}
        <a href="https://github.com/FredoBangin/https-deathraceradio.xyz-" target="_blank" rel="noreferrer">
          GitHub
        </a>
        . That's the fastest way to get a response.
      </p>
    </section>

    <section className="static-section">
      <h2>Track submissions & corrections</h2>
      <p>
        If you have a track, metadata correction, or sourcing info to submit, email us at{' '}
        <a href="mailto:contact@deathraceradio.xyz">contact@deathraceradio.xyz</a>. Include the
        track name, era, and any relevant context.
      </p>
    </section>

    <section className="static-section">
      <h2>Copyright & DMCA</h2>
      <p>
        If you are a rights holder with a removal request, please review the{' '}
        <a href="/dmca">DMCA policy</a> for the correct procedure. DMCA notices should be sent to{' '}
        <a href="mailto:dmca@deathraceradio.xyz">dmca@deathraceradio.xyz</a>.
      </p>
    </section>
  </div>
);

export default Contact;
