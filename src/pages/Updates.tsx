import React from 'react';
import { devUpdateNotifications } from '../data/devUpdates';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const Updates: React.FC = () => (
  <div className="static-page">
    <header className="static-page-header">
      <h1>Updates</h1>
      <p>A log of site changes and new features.</p>
    </header>

    <section className="static-section">
      <div className="updates-list">
        {[...devUpdateNotifications].reverse().map(update => (
          <div key={update.id} className="update-entry">
            <div className="update-meta">
              <span className="update-tag">{update.tag}</span>
              <time className="update-date">{formatDate(update.date)}</time>
            </div>
            <h3>{update.title}</h3>
            <p>{update.body}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default Updates;
