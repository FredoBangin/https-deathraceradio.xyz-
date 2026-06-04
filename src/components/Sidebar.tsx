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
      {/* Logo */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
        <div className="sidebar-brand-text">
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>deathraceradio</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1px' }}>Archive player</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 20px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400,
              fontSize: '13.5px',
              borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              background: isActive ? 'var(--accent-light)' : 'transparent',
              boxShadow: isActive ? 'inset 0 0 24px rgba(255,85,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} style={{ flexShrink: 0, filter: isActive ? 'drop-shadow(0 0 6px rgba(255,85,0,0.6))' : 'none' }} />
                <span className="sidebar-nav-label">{label}</span>
                {isActive && (
                  <div style={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '20px', background: 'var(--accent)',
                    borderRadius: '2px 0 0 2px',
                    boxShadow: '0 0 8px rgba(255,85,0,0.8)',
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Upload button */}
        <div style={{ margin: '16px 16px 0', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button
            onClick={() => dispatch(openUploadModal(null))}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 14px', borderRadius: '6px', fontSize: '13px',
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--glow-sm)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <Upload size={14} />
            <span className="sidebar-upload-label">Add audio</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Powered by Juice WRLD API
      </div>
    </div>
  );
};
export default Sidebar;
