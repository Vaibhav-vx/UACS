import { useState, useEffect } from 'react';
import {
  User, Lock, Building2, Mail, Save, Loader2,
  AlertCircle, CheckCircle2, Shield, KeyRound,
  Eye, EyeOff, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="glass-card overflow-hidden">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 18, height: 18, color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon style={{ width: 13, height: 13 }} />} {label}
      </label>
      {children}
    </div>
  );
}

function InlineAlert({ type, msg }) {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div className="animate-fade-in" style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, fontSize: 13,
      background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
      color: isErr ? '#ef4444' : '#22c55e',
    }}>
      {isErr ? <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> : <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  // Profile section
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [dept,       setDept]       = useState('');
  const [role,       setRole]       = useState('');
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg,    setProfMsg]    = useState({ type: '', text: '' });

  // Password section
  const [curPwd,   setCurPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confPwd,  setConfPwd]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,   setPwdMsg]   = useState({ type: '', text: '' });

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('uacs_user') || '{}');
      setName(u.name || '');
      setEmail(u.email || '');
      setDept(u.department || '');
      setRole(u.role || 'admin');
    } catch {}
  }, []);

  const saveProfile = async () => {
    setProfMsg({ type: '', text: '' });
    if (!name.trim()) { setProfMsg({ type: 'error', text: 'Name is required' }); return; }
    setProfSaving(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim(), department: dept.trim() });
      const updated = res.data.user;
      localStorage.setItem('uacs_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('uacs_user') || '{}'), ...updated }));
      setProfMsg({ type: 'success', text: 'Profile updated successfully' });
      toast.success('Profile saved');
    } catch (err) {
      setProfMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setProfSaving(false);
    }
  };

  const changePassword = async () => {
    setPwdMsg({ type: '', text: '' });
    if (!curPwd || !newPwd || !confPwd) { setPwdMsg({ type: 'error', text: 'All password fields are required' }); return; }
    if (newPwd.length < 8) { setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters' }); return; }
    if (newPwd !== confPwd) { setPwdMsg({ type: 'error', text: 'New passwords do not match' }); return; }
    setPwdSaving(true);
    try {
      await authApi.changePassword({ currentPassword: curPwd, newPassword: newPwd });
      setPwdMsg({ type: 'success', text: 'Password changed. Please log in again.' });
      setCurPwd(''); setNewPwd(''); setConfPwd('');
      toast.success('Password changed');
      setTimeout(() => { localStorage.clear(); navigate('/login'); }, 2000);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
      {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in" style={{ maxWidth: 640 }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <User className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          My Profile
        </h1>
        <p className="text-sm mt-1 text-theme-muted">Manage your account details and security settings</p>
      </div>

      {/* Account info badge */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 22 }}>{(name || 'A')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{name || '—'}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{email}</p>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', flexShrink: 0 }}>
          {role}
        </span>
      </div>

      {/* Profile Info */}
      <Section title="Personal Information" subtitle="Update your name and department" icon={User}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Full Name" icon={User}>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </Field>
          <Field label="Email Address" icon={Mail}>
            <input className="input-field" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Email cannot be changed</p>
          </Field>
          <Field label="Department" icon={Building2}>
            <input className="input-field" value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Central Command" />
          </Field>
          {profMsg.text && <InlineAlert type={profMsg.type} msg={profMsg.text} />}
          <button onClick={saveProfile} disabled={profSaving} className="btn-primary" style={{ width: 'fit-content', gap: 8 }}>
            {profSaving ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Saving...</> : <><Save style={{ width: 15, height: 15 }} /> Save Changes</>}
          </button>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" subtitle="Use a strong password — minimum 8 characters" icon={KeyRound}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Current Password', val: curPwd, set: setCurPwd, id: 'cur-pwd' },
            { label: 'New Password',     val: newPwd, set: setNewPwd, id: 'new-pwd' },
            { label: 'Confirm New Password', val: confPwd, set: setConfPwd, id: 'conf-pwd' },
          ].map(({ label, val, set, id }) => (
            <Field key={id} label={label} icon={Lock}>
              <div style={{ position: 'relative' }}>
                <input id={id} className="input-field" type={showPwd ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)} placeholder="••••••••" style={{ paddingRight: 36 }} />
                <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
              </div>
            </Field>
          ))}
          {pwdMsg.text && <InlineAlert type={pwdMsg.type} msg={pwdMsg.text} />}
          <button onClick={changePassword} disabled={pwdSaving} className="btn-primary" style={{ width: 'fit-content', gap: 8 }}>
            {pwdSaving ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Changing...</> : <><Shield style={{ width: 15, height: 15 }} /> Change Password</>}
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Session" subtitle="Sign out from this device" icon={LogOut}>
        <button onClick={handleLogout} className="btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.35)', color: '#ef4444', gap: 8 }}>
          <LogOut style={{ width: 15, height: 15 }} /> Sign Out
        </button>
      </Section>
    </div>
  );
}
