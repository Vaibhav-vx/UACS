import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
  Sun, Moon, Globe, ChevronDown, User, Building2, UserPlus,
  LogIn, CheckCircle2, ArrowRight, Smartphone, ScrollText,
  KeyRound
} from 'lucide-react';
import { authApi } from '../api';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';

// ── Animated background orbs ─────────────────────────────
function BgOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '-30%', left: '-20%', width: '60%', height: '60%',
        borderRadius: '50%', filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-20%', width: '55%', height: '55%',
        borderRadius: '50%', filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
        animation: 'float2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '10%', width: '30%', height: '30%',
        borderRadius: '50%', filter: 'blur(60px)',
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        animation: 'float1 12s ease-in-out infinite reverse',
      }} />
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, -15px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}

// ── Input field component ─────────────────────────────────
function Field({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, autoFocus, autoComplete, rightEl, hint }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ width: 15, height: 15, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className="input-field"
          style={{ paddingLeft: 36, paddingRight: rightEl ? 40 : undefined, width: '100%' }}
        />
        {rightEl}
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ── Password strength bar ─────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const label  = labels[strength - 1] || 'Too short';
  const color  = colors[strength - 1] || '#ef4444';

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s',
            background: i <= strength ? color : 'var(--border)',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('login');   // 'login' | 'register'

  // Login state
  const [loginPhone, setLoginPhone]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd]   = useState(false);
  const [loginLoading, setLoginLoading]   = useState(false);
  const [loginError, setLoginError]       = useState('');

  // Register state
  const [regName, setRegName]             = useState('');
  const [regPhone, setRegPhone]           = useState('');
  const [regDept, setRegDept]             = useState('');
  const [regPassword, setRegPassword]     = useState('');
  const [regConfirm, setRegConfirm]       = useState('');
  const [showRegPwd, setShowRegPwd]       = useState(false);
  const [regLoading, setRegLoading]       = useState(false);
  const [regError, setRegError]           = useState('');
  const [regSuccess, setRegSuccess]       = useState(false);

  // Password Strength Check
  const getPasswordCriteria = (pwd) => ({
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[@$!%*?&]/.test(pwd),
  });
  const criteria = getPasswordCriteria(regPassword);
  const isPasswordStrong = Object.values(criteria).every(Boolean);
  const [langOpen, setLangOpen]           = useState(false);
  const navigate                          = useNavigate();
  const [searchParams]                    = useSearchParams();
  const { theme, toggleTheme }            = useTheme();
  const { t, language, setLanguage, LANGUAGES } = useLanguage();
  const curLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const token = localStorage.getItem('uacs_token');
    if (token) { navigate('/dashboard'); return; }
    if (searchParams.get('expired') === '1') setLoginError(t('sessionExpired') || 'Your session has expired. Please log in again.');
  }, [navigate, searchParams, t]);

  // Phone auto-formatter (XXXXX XXXXX) — only for registration
  const formatPhoneNumber = (value) => {
    const cleaned = ('' + value).replace(/\D/g, '').substring(0, 10);
    const match = cleaned.match(/^(\d{1,5})(\d{0,5})$/);
    if (match) {
      return match[2] ? `${match[1]} ${match[2]}` : match[1];
    }
    return cleaned;
  };

  const handleLoginPhoneChange = (e) => {
    const val = e.target.value;
    // If it contains letters or @, don't format it as a phone number
    if (/[a-zA-Z@]/.test(val)) {
      setLoginPhone(val);
    } else {
      setLoginPhone(formatPhoneNumber(val));
    }
    setLoginError('');
  };

  // ── Login handler ─────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginPhone.trim()) { setLoginError('Mobile number is required'); return; }
    if (!loginPassword)     { setLoginError('Password is required'); return; }
    setLoginLoading(true);
    try {
      const res = await authApi.login(loginPhone.trim(), loginPassword);
      localStorage.setItem('uacs_token', res.data.token);
      localStorage.setItem('uacs_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid mobile or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register handler ──────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim())  { setRegError('Full name is required'); return; }
    if (!regPhone.trim()) { setRegError('Mobile number is required'); return; }
    if (!isPasswordStrong) { setRegError('Please meet all password requirements'); return; }
    if (regPassword !== regConfirm) { setRegError('Passwords do not match'); return; }

    setRegLoading(true);
    try {
      const res = await authApi.register({ 
        name: regName.trim(), 
        phone: regPhone.trim(), 
        password: regPassword, 
        department: regDept.trim() 
      });
      toast.success(t('regSuccess') || 'Registration successful!');
      localStorage.setItem('uacs_user', JSON.stringify(res.data.user));
      setRegSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // ── Demo Login handler ────────────────────────────────
  const handleDemoLogin = async () => {
    setRegError('');
    setRegLoading(true);
    try {
      const res = await authApi.demo();
      localStorage.setItem('uacs_token', res.data.token);
      localStorage.setItem('uacs_user', JSON.stringify(res.data.user));
      // Set demo preferences for better initial visualization
      localStorage.setItem('uacs_pref_zone', 'Zone 4');
      localStorage.setItem('uacs_pref_lang', 'hindi');
      toast.success(t('demoLoginSuccess') || 'Welcome to Demo Portal');
      navigate('/dashboard');
    } catch (err) {
      setRegError(err.response?.data?.error || 'Failed to login as Demo User');
      setRegLoading(false);
    }
  };

  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      tabIndex={-1}
      style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
        padding: 4, display: 'flex',
      }}
    >
      {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', background: 'var(--bg-base)' }}>
      <BgOrbs />

      {/* Top-right: language + theme */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="theme-toggle"
            style={{ width: 'auto', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Globe style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 13 }}>{curLang.flag}</span>
            <ChevronDown style={{ width: 12, height: 12 }} />
          </button>
          {langOpen && (
            <div className="animate-fade-in" style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 150, borderRadius: 10,
              background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 10, background: language === l.code ? 'var(--accent-bg)' : 'transparent',
                    color: language === l.code ? 'var(--accent)' : 'var(--text-primary)', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
        </button>
      </div>

      {/* Card */}
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 460, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18, marginBottom: 16,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
          }}>
            <Shield style={{ width: 30, height: 30, color: 'white' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
            UACS Portal
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Unified Authority Communication System
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg-surface)', borderRadius: 12,
          padding: 4, marginBottom: 18, border: '1px solid var(--border)',
        }}>
          {[
            { key: 'login',    label: t('loginButton') || 'Sign In',    Icon: LogIn },
            { key: 'register', label: t('register') || 'Register',   Icon: UserPlus },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setLoginError(''); setRegError(''); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === key ? 'var(--accent)' : 'transparent',
                color: tab === key ? 'white' : 'var(--text-secondary)',
                boxShadow: tab === key ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Login Form ───────────────────────────────── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="glass-card animate-fade-in" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t('welcomeBack') || 'Welcome back'}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{t('signInToUacs') || 'Sign in to your UACS account'}</p>
            </div>

            {loginError && (
              <div className="animate-fade-in" style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 8,
                marginBottom: 16, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13,
              }}>
                <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                {loginError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field
                id="login-phone"
                label={t('Mobile No.') || 'Mobile Number'}
                icon={Mail}
                type="text"
                value={loginPhone}
                onChange={handleLoginPhoneChange}
                placeholder="+91 1234567890"
                autoFocus
              />
              <Field
                id="login-password"
                label={t('passwordLabel') || 'Password'}
                icon={Lock}
                type={showLoginPwd ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                placeholder={t('passwordLabel') || 'Enter your password'}
                autoComplete="current-password"
                rightEl={<EyeBtn show={showLoginPwd} toggle={() => setShowLoginPwd(v => !v)} />}
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loginLoading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 14, marginTop: 22, gap: 8 }}
            >
              {loginLoading
                ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Signing in...</>
                : <><LogIn style={{ width: 16, height: 16 }} /> Sign In</>
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              {t('dontHaveAccount') || "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setTab('register')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 12, padding: 0 }}
              >
                {t('createOne') || 'Create one'}
              </button>
            </p>
          </form>
        )}

        {/* ── Register Form ─────────────────────────────── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="glass-card animate-fade-in" style={{ padding: 28 }}>
            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: '#22c55e' }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{t('accountCreated') || 'Account Created!'}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('redirecting') || 'Redirecting to dashboard...'}</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t('createAccount') || 'Create an account'}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{t('joinUacs') || 'Join UACS as an authorized administrator'}</p>
                </div>

                {regError && (
                  <div className="animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 8,
                    marginBottom: 16, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13,
                  }}>
                    <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                    {regError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field
                    id="reg-name"
                    label={t('fullName') || 'Full Name'}
                    icon={User}
                    value={regName}
                    onChange={e => { setRegName(e.target.value); setRegError(''); }}
                    placeholder="e.g. Vaibhav Dubey"
                    autoFocus
                    autoComplete="name"
                  />
                  <Field
                    id="reg-phone"
                    label={t('mobileNumber') || 'Mobile Number'}
                    icon={Smartphone}
                    type="tel"
                    value={regPhone}
                    onChange={e => { setRegPhone(formatPhoneNumber(e.target.value)); setRegError(''); }}
                    placeholder="81698 25915"
                    autoComplete="tel"
                  />
                  <Field
                    id="reg-dept"
                    label={<>{t('department') || 'Department'} <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}>({t('optional') || 'optional'})</span></>}
                    icon={Building2}
                    value={regDept}
                    onChange={e => setRegDept(e.target.value)}
                    placeholder={t('deptPlaceholder') || "e.g. Central Command"}
                    autoComplete="organization"
                  />
                  <div>
                    <Field
                      id="reg-password"
                      label={t('passwordLabel') || 'Password'}
                      icon={Lock}
                      type={showRegPwd ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                      placeholder={t('min8Chars') || "Min 8 characters"}
                      autoComplete="new-password"
                      rightEl={<EyeBtn show={showRegPwd} toggle={() => setShowRegPwd(v => !v)} />}
                    />
                    
                    {/* Strength Checklist */}
                    {regPassword && (
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('securityRequirements') || 'Security Requirements'}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                          {[
                            { label: t('eightPlusChars') || '8+ Characters', met: criteria.length },
                            { label: t('uppercase') || 'Uppercase', met: criteria.upper },
                            { label: t('number') || 'Number', met: criteria.number },
                            { label: t('specialSymbol') || 'Special Symbol', met: criteria.special },
                          ].map(c => (
                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c.met ? 'var(--accent)' : 'var(--text-dim)' }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.met ? 'var(--accent)' : 'transparent', border: `1px solid ${c.met ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {c.met && <CheckCircle2 style={{ width: 8, height: 8, color: 'white' }} />}
                              </div>
                              {c.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Field
                    id="reg-confirm"
                    label={t('confirmPassword') || 'Confirm Password'}
                    icon={Lock}
                    type={showRegPwd ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={e => { setRegConfirm(e.target.value); setRegError(''); }}
                    placeholder={t('reEnterPassword') || "Re-enter your password"}
                    autoComplete="new-password"
                    hint={regConfirm && regPassword !== regConfirm ? (t('passwordsDontMatch') || '⚠ Passwords do not match') : regConfirm && regPassword === regConfirm ? (t('passwordsMatch') || '✓ Passwords match') : ''}
                  />

                  <div style={{ marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="btn-primary"
                      style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 15, fontWeight: 700, gap: 10 }}
                    >
                      {regLoading ? (
                        <><Loader2 className="animate-spin" style={{ width: 20, height: 20 }} /> {t('creatingAccount') || 'Creating Account...'}</>
                      ) : (
                        <><CheckCircle2 style={{ width: 20, height: 20 }} /> {t('createAccount') || 'Create Account'}</>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={regLoading}
                      className="btn-secondary"
                      style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 15, fontWeight: 700, gap: 10, marginTop: 12 }}
                    >
                      <UserPlus style={{ width: 20, height: 20 }} /> {t('demoLogin') || 'Try Demo Profile'}
                    </button>
                  </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
                  {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 12, padding: 0 }}
                  >
                    {t('loginButton') || 'Sign in'}
                  </button>
                </p>
              </>
            )}
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 24 }}>
          🇮🇳 {t('govFooter') || 'Government of India • Secure Communication Portal • v1.0'}
        </p>
      </div>
    </div>
  );
}
