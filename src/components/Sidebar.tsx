import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, Heart, Upload } from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { openUploadModal } from '../features/upload/uploadSlice';

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();

  const navItems = [
    { to: '/',       label: 'Home',         icon: Home },
    { to: '/eras',   label: 'Browse Vault', icon: Library },
    { to: '/liked',  label: 'Liked',        icon: Heart },
  ];

  return (
    <div className="sidebar-area custom-scroll">
      <div className="sidebar-logo-block">
        <div className="sidebar-brand-text">
          <div>deathraceradio</div>
          <span>Archive player</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <span className={isActive ? 'active' : ''}>
                <Icon size={20} />
                <strong>{label}</strong>
              </span>
            )}
          </NavLink>
        ))}

        <button className="sidebar-upload-btn" onClick={() => dispatch(openUploadModal(null))}>
          <Upload size={18} />
          <strong>Add Audio</strong>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
