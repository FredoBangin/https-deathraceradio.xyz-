import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDown,
  Disc3,
  FileText,
  Heart,
  Home,
  Info,
  ListMusic,
  Radio,
} from './AppIcon';

export const Sidebar: React.FC = () => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar_collapsed_sections') || '{}') as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(previous => {
      const next = { ...previous, [section]: !previous[section] };
      localStorage.setItem('sidebar_collapsed_sections', JSON.stringify(next));
      return next;
    });
  };

  const mainNavItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/radio', label: 'Radio', icon: Radio },
  ];

  const libraryNavItems = [
    { to: '/songs', label: 'Songs', icon: ListMusic },
    { to: '/eras', label: 'Eras', icon: Disc3 },
    { to: '/liked', label: 'Likes', icon: Heart },
  ];

  const infoNavItems = [
    { to: '/about', label: 'About', icon: Info },
    { to: '/updates', label: 'Updates', icon: FileText },
  ];

  return (
    <div className="sidebar-area custom-scroll">
      <div className="sidebar-logo-block">
        <div className="sidebar-brand-text">
          <div>deathraceradio</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          {mainNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <span className={isActive ? 'active' : ''}>
                  <Icon size={19} />
                  <strong>{label}</strong>
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className={`sidebar-nav-section ${collapsedSections.library ? 'collapsed' : ''}`}>
          <button
            className="sidebar-section-header"
            type="button"
            onClick={() => toggleSection('library')}
            aria-expanded={!collapsedSections.library}
          >
            <span>Library</span>
            <ChevronDown size={15} className="sidebar-section-chevron" />
          </button>
          <div className="sidebar-section-body">
            {libraryNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span className={isActive ? 'active' : ''}>
                    <Icon size={19} />
                    <strong>{label}</strong>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className={`sidebar-nav-section ${collapsedSections.info ? 'collapsed' : ''}`}>
          <button
            className="sidebar-section-header"
            type="button"
            onClick={() => toggleSection('info')}
            aria-expanded={!collapsedSections.info}
          >
            <span>Info</span>
            <ChevronDown size={15} className="sidebar-section-chevron" />
          </button>
          <div className="sidebar-section-body">
            {infoNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span className={isActive ? 'active' : ''}>
                    <Icon size={19} />
                    <strong>{label}</strong>
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
