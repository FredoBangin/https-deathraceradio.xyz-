import React from 'react';
import { NavLink } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <p className="site-footer-disclaimer">
      Fan-made archive for preservation purposes only. All rights belong to the Juice WRLD estate,
      Grade A Productions, and respective rights holders.
    </p>
    <nav className="site-footer-links">
      <NavLink to="/about">About</NavLink>
      <NavLink to="/faq">FAQ</NavLink>
      <NavLink to="/updates">Updates</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <NavLink to="/privacy">Privacy</NavLink>
      <NavLink to="/terms">Terms</NavLink>
      <NavLink to="/dmca">DMCA</NavLink>
    </nav>
  </footer>
);

export default Footer;
