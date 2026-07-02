import React from 'react';

export const DMCA: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>DMCA Policy</h1>
      <p>Last updated: July 2, 2026</p>
    </header>

    <section className="static-section">
      <h2>Notice</h2>
      <p>
        Death Race Radio does not host audio files. All audio is streamed from{' '}
        <a href="https://juicewrldapi.com" target="_blank" rel="noreferrer">juicewrldapi.com</a>.
        Copyright concerns related to specific audio files should be directed to that service.
      </p>
      <p>
        If you believe content displayed on this site — including metadata, descriptions, or images —
        infringes your copyright, you may submit a takedown notice under the Digital Millennium
        Copyright Act (DMCA).
      </p>
    </section>

    <section className="static-section">
      <h2>How to submit a notice</h2>
      <p>Send a written notice to <a href="mailto:dmca@deathraceradio.xyz">dmca@deathraceradio.xyz</a> containing:</p>
      <ol>
        <li>Identification of the copyrighted work you claim has been infringed.</li>
        <li>Identification of the material on our site you believe infringes your copyright, with enough detail for us to locate it.</li>
        <li>Your contact information (name, address, phone number, email).</li>
        <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or law.</li>
        <li>A statement that the information in the notice is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</li>
        <li>Your physical or electronic signature.</li>
      </ol>
    </section>

    <section className="static-section">
      <h2>Counter-notification</h2>
      <p>
        If you believe content was removed in error, you may submit a counter-notification to the same
        address with the relevant information. We will process it in accordance with DMCA procedures.
      </p>
    </section>

    <section className="static-section">
      <h2>Repeat infringers</h2>
      <p>
        We will terminate accounts of users who are repeat copyright infringers in appropriate
        circumstances.
      </p>
    </section>
  </div>
);

export default DMCA;
