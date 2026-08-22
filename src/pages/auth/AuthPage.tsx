import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { usePlatform } from '@/contexts/PlatformContext';
import './AuthPage.css';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'login';
  const navigate = useNavigate();
  const { settings } = usePlatform();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  const switchTab = (tab: string) => {
    setError(null);
    setSearchParams({ tab });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/app/dashboard');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: fullName,
          phone_number: regPhone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/verify-email');
    }
  };

  return (
    <div className="auth-page">
      {/* Left side — form */}
      <div className="auth-left">
        <div className="auth-form-box">
          {/* Logo */}
          <Link to="/" className="auth-logo">
            <div className="auth-logo-mark">
              <i className="fa-solid fa-file-invoice" />
            </div>
            <span className="auth-logo-brand">{settings.siteName}</span>
          </Link>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
              type="button"
            >
              <i className="fa-solid fa-right-to-bracket" /> Sign In
            </button>
            <button
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
              type="button"
            >
              <i className="fa-solid fa-user-plus" /> Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="panel-head">
                <h2>Welcome back</h2>
                <p>Enter your credentials to access your account</p>
              </div>

              <div className="field">
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <i className="fa-solid fa-envelope field-icon" />
                  <input
                    className="field-input"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <i className="fa-solid fa-lock field-icon" />
                  <input
                    className="field-input"
                    type={showLoginPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowLoginPwd(!showLoginPwd)}
                  >
                    <i className={`fa-solid ${showLoginPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="auth-meta">
                <Link to="/forgot-password" className="auth-forgot">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket" /> Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="panel-head">
                <h2>Create your account</h2>
                <p>Join thousands of businesses using InvoiceHub</p>
              </div>

              <div className="field">
                <label className="field-label">Full Name</label>
                <div className="field-wrap">
                  <i className="fa-solid fa-user field-icon" />
                  <input
                    className="field-input"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <i className="fa-solid fa-envelope field-icon" />
                  <input
                    className="field-input"
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Phone Number</label>
                <div className="field-wrap">
                  <i className="fa-solid fa-phone field-icon" />
                  <input
                    className="field-input"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-row">
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="field-wrap">
                    <i className="fa-solid fa-lock field-icon" />
                    <input
                      className="field-input"
                      type={showRegPwd ? 'text' : 'password'}
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="field-toggle"
                      onClick={() => setShowRegPwd(!showRegPwd)}
                    >
                      <i className={`fa-solid ${showRegPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Confirm Password</label>
                  <div className="field-wrap">
                    <i className="fa-solid fa-lock field-icon" />
                    <input
                      className="field-input"
                      type={showRegPwd ? 'text' : 'password'}
                      placeholder="Confirm"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus" /> Create Account
                  </>
                )}
              </button>

              <p className="auth-terms">
                By creating an account, you agree to our{' '}
                <a href="#">Terms of Service</a> and{' '}
                <a href="#">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Right side — decorative panel */}
      <div className="auth-right">
        <div className="auth-right-content">
          <div className="auth-right-icon">
            <i className="fa-solid fa-file-invoice-dollar" />
          </div>
          <h2>Professional Invoicing Made Simple</h2>
          <p>
            Create branded invoices, quotations, and receipts in seconds.
            Get paid faster with integrated payment links.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="fa-solid fa-bolt" />
              </div>
              <div>
                <strong>Lightning Fast</strong>
                <span>Create invoices in under 60 seconds</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="fa-solid fa-palette" />
              </div>
              <div>
                <strong>Fully Branded</strong>
                <span>Your logo, colors, and signature</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <i className="fa-solid fa-credit-card" />
              </div>
              <div>
                <strong>Online Payments</strong>
                <span>Paystack-powered payment links</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
