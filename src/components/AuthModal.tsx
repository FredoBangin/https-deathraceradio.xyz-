import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldAlert } from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: username || email.split('@')[0],
              },
            },
          });
          if (error) throw error;
          if (data.user) {
            dispatch(setUser({
              id: data.user.id,
              email: data.user.email || '',
              user_metadata: data.user.user_metadata,
            }));
            onClose();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            dispatch(setUser({
              id: data.user.id,
              email: data.user.email || '',
              user_metadata: data.user.user_metadata,
            }));
            onClose();
          }
        }
      } else {
        // Local demo mode simulation
        setTimeout(() => {
          const simulatedUser = {
            id: crypto.randomUUID(),
            email,
            user_metadata: {
              username: username || email.split('@')[0],
            },
          };
          dispatch(setUser(simulatedUser));
          setLoading(false);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '8px',
          padding: '28px',
          position: 'relative',
          background: 'var(--bg-secondary)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.65)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '22px', paddingRight: '36px' }}>
          <div className="section-label" style={{ marginBottom: '8px' }}>Account</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Sign in to save likes and manage community uploads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <button
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: !isSignUp ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '16px',
              fontWeight: 600,
              paddingBottom: '10px',
              borderBottom: !isSignUp ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: isSignUp ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '16px',
              fontWeight: 600,
              paddingBottom: '10px',
              borderBottom: isSignUp ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Display name</label>
              <input
                type="text"
                placeholder="How should your uploads appear?"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px', height: '42px' }}
              />
              <User size={16} style={{ position: 'absolute', bottom: '13px', left: '14px', color: 'var(--text-secondary)' }} />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', height: '42px' }}
            />
            <Mail size={16} style={{ position: 'absolute', bottom: '13px', left: '14px', color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', height: '42px' }}
            />
            <Lock size={16} style={{ position: 'absolute', bottom: '13px', left: '14px', color: 'var(--text-secondary)' }} />
          </div>

          {!isSupabaseConfigured && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: '#3b82f6', fontSize: '12px' }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Demo mode is active. Any email and password will sign you in locally.
              </span>
            </div>
          )}

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '13px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '44px', width: '100%', marginTop: '8px' }}>
            {loading ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AuthModal;
