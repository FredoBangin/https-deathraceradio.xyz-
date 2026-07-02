import React, { useState } from 'react';
import { ChevronDown } from '../components/AppIcon';

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Why can\'t I hear some tracks?',
    a: 'Some tracks in the catalog don\'t have audio available — either because it hasn\'t been surfaced or the file isn\'t in the API yet. Tracks without audio show a "No audio available" state in the player.',
  },
  {
    q: 'Where does the audio come from?',
    a: (
      <>
        All audio is served by{' '}
        <a href="https://juicewrldapi.com" target="_blank" rel="noreferrer">juicewrldapi.com</a>.
        Death Race Radio does not host any files itself.
      </>
    ),
  },
  {
    q: 'How do I submit a track or correct metadata?',
    a: (
      <>
        Reach out via the <a href="/contact">contact page</a>. Include the track name, era, and any
        sourcing information you have. Submissions are reviewed before being added.
      </>
    ),
  },
  {
    q: 'Are downloads available?',
    a: 'No. This site is a streaming archive only. We don\'t offer downloads, as the audio is not ours to distribute.',
  },
  {
    q: 'How do likes and account data work?',
    a: 'Creating an account stores your liked tracks in our database so they sync across devices. Without an account, likes are saved in your browser\'s local storage and won\'t carry over to other devices.',
  },
  {
    q: 'Is this affiliated with Juice WRLD\'s estate or label?',
    a: 'No. This is an independent fan project. It is not affiliated with, endorsed by, or connected to Grade A Productions, Interscope Records, or the Juice WRLD estate.',
  },
  {
    q: 'I found a bug or something broken — how do I report it?',
    a: (
      <>
        Open an issue on{' '}
        <a href="https://github.com/FredoBangin/https-deathraceradio.xyz-" target="_blank" rel="noreferrer">
          GitHub
        </a>{' '}
        or use the <a href="/contact">contact page</a>.
      </>
    ),
  },
];

const FAQItem: React.FC<{ q: string; a: React.ReactNode }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)} type="button">
        <span>{q}</span>
        <ChevronDown size={16} className="faq-chevron" />
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
};

export const FAQ: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>FAQ</h1>
      <p>Common questions about the site.</p>
    </header>

    <section className="static-section">
      <div className="faq-list">
        {faqs.map(item => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  </div>
);

export default FAQ;
