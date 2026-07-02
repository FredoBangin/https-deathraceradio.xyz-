import React from 'react';
import { NavLink } from 'react-router-dom';

export const About: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>About</h1>
      <p>What this is and why it exists.</p>
    </header>

    <section className="static-section">
      <h2>The archive</h2>
      <p>
        Death Race Radio is a fan-built catalog and player for Juice WRLD's music — released albums,
        unreleased recordings, unsurfaced sessions, and everything in between. The goal is a single
        place where fans can explore and listen to the full documented catalog, organized by era and
        category.
      </p>
      <p>
        All audio and metadata is served by{' '}
        <a href="https://juicewrldapi.com" target="_blank" rel="noreferrer">juicewrldapi.com</a>.
        We don't host or own any of the audio files.
      </p>
    </section>

    <section className="static-section">
      <h2>Track categories</h2>
      <ul>
        <li><strong>Released</strong> — officially published on streaming platforms or physical media.</li>
        <li><strong>Unreleased</strong> — recorded but never officially published; circulated among fans.</li>
        <li><strong>Unsurfaced</strong> — referenced or known to exist but with no known circulating audio.</li>
        <li><strong>Recording Session</strong> — session fragments, freestyles, and voice memo recordings.</li>
      </ul>
    </section>

    <section className="static-section">
      <h2>Copyright</h2>
      <p>
        This is a fan-made archive for preservation and research purposes only. All rights to the music
        belong to the Juice WRLD estate, Grade A Productions, Interscope Records, and respective rights
        holders. No content on this site is sold or monetized.
      </p>
      <p>
        If you are a rights holder and have a concern, please review our{' '}
        <NavLink to="/dmca">DMCA policy</NavLink> or{' '}
        <NavLink to="/contact">contact us</NavLink> directly.
      </p>
    </section>

    <section className="static-section">
      <h2>Open source</h2>
      <p>
        The site's source code is open source and available on{' '}
        <a href="https://github.com/FredoBangin/https-deathraceradio.xyz-" target="_blank" rel="noreferrer">
          GitHub
        </a>
        . Contributions are welcome.
      </p>
    </section>
  </div>
);

export default About;
