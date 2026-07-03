import React, { useEffect, useId, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { X, Lock, Mail, User } from './AppIcon';
import { AppCheckbox } from './AppCheckbox';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import {
  isSupabaseConfigured,
  setAuthRememberMe,
  supabase,
  toUserSession,
  upsertProfile,
} from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const passwordChecks = [
  { label: '8+ characters', test: (value: string) => value.length >= 8 },
  { label: 'Uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number', test: (value: string) => /\d/.test(value) },
  { label: 'Symbol', test: (value: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value) },
];

const getFriendlyAuthError = (error: unknown) => {
  const errorLike = error && typeof error === 'object'
    ? error as { message?: string; status?: number }
    : {};
  const message = errorLike.message || 'Authentication failed. Please try again.';
  const status = errorLike.status;

  if (status === 429 || /rate limit|too many requests|email rate/i.test(message)) {
    return 'Email rate limit hit. Supabase only allows a couple built-in auth emails per hour, so wait a bit or disable email confirmations while testing.';
  }

  if (/email not confirmed/i.test(message)) {
    return 'Check your email to confirm your account before signing in.';
  }

  if (/invalid login credentials/i.test(message)) {
    return 'That email or password does not match an account.';
  }

  return message;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const titleId = useId();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordStatus = passwordChecks.map(check => ({ ...check, passed: check.test(password) }));
  const passwordReady = passwordStatus.every(check => check.passed);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resetMode = (nextIsSignUp: boolean) => {
    setIsSignUp(nextIsSignUp);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const finishAuth = async (user: SupabaseUser, name?: string) => {
    await upsertProfile(user, name);
    dispatch(setUser(await toUserSession(user)));
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    setAuthRememberMe(rememberMe);

    const safeEmail = email.trim();
    const safeDisplayName = (displayName || safeEmail.split('@')[0]).trim();

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Authentication is unavailable because Supabase is not configured.');
      }

      if (isSignUp && !passwordReady) {
        throw new Error('Use a stronger password before creating your account.');
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: safeEmail,
          password,
          options: {
            data: {
              display_name: safeDisplayName,
              username: safeDisplayName,
            },
          },
        });
        if (error) throw error;
        if (data.session?.user) {
          await finishAuth(data.session.user, safeDisplayName);
        } else if (data.user) {
          setPassword('');
          setSuccessMsg('Account created. Check your email to confirm it, then sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
        });
        if (error) throw error;
        if (data.user) await finishAuth(data.user);
      }
    } catch (err: unknown) {
      setErrorMsg(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop" onMouseDown={onClose}>
      <section
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="auth-header">
          <div className="auth-header-top">
            <span>Account</span>
            <button className="auth-close-btn" onClick={onClose} type="button" aria-label="Close sign in">
              <X size={16} />
            </button>
          </div>
          <h2 id={titleId}>{isSignUp ? 'Create account' : 'Sign in'}</h2>
          <p>{isSignUp ? 'Choose a display name for comments and community features.' : 'Save likes and get ready for track comments.'}</p>
        </header>

        <div className="auth-mode-tabs" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={!isSignUp ? 'active' : ''}
            onClick={() => resetMode(false)}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={isSignUp ? 'active' : ''}
            onClick={() => resetMode(true)}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <label className="auth-field">
              <span>Display name</span>
              <div>
                <User size={16} />
                <input
                  type="text"
                  placeholder="How should you appear?"
                  required
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <div>
              <Mail size={16} />
              <input
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div>
              <Lock size={16} />
              <input
                type="password"
                placeholder={isSignUp ? '8+ chars, mixed case, number, symbol' : 'Your password'}
                required
                minLength={isSignUp ? 8 : 6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {isSignUp && (
              <ul className="auth-password-checks" aria-label="Password requirements">
                {passwordStatus.map(check => (
                  <li key={check.label} className={check.passed ? 'passed' : ''}>
                    <span aria-hidden="true" />
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
          </label>

          <AppCheckbox
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            className="auth-remember-row"
            variant="soft"
            size="sm"
          >
            Remember me
          </AppCheckbox>

          {successMsg && <div className="auth-success">{successMsg}</div>}
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AuthModal;
