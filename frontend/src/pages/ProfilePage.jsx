import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api/auth';
import { aiAPI } from '../api/ai';
import {
  User,
  Lock,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Zap,
  Terminal
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Ollama Status
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [checkingOllama, setCheckingOllama] = useState(false);

  const checkOllama = async () => {
    setCheckingOllama(true);
    try {
      const res = await aiAPI.getStatus();
      setOllamaStatus(res.data);
    } catch {
      setOllamaStatus({
        available: false,
        message: 'Could not connect to backend AI status endpoint.'
      });
    } finally {
      setCheckingOllama(false);
    }
  };

  useEffect(() => {
    checkOllama();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({ full_name: fullName, email });
      updateUser(res.data);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'warning');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      addToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile & System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account preferences, credentials, and local free AI engine configuration.
        </p>
      </div>

      {/* FREE LOCAL AI STATUS CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">100% Free Local AI Engine (₹0)</h2>
              <p className="text-xs text-indigo-200">Zero paid APIs · Complete privacy · Offline enabled</p>
            </div>
          </div>
          <button
            type="button"
            onClick={checkOllama}
            disabled={checkingOllama}
            className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingOllama ? 'animate-spin' : ''}`} />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Local AI Status:</span>
            {ollamaStatus?.available ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Connected to Ollama ({ollamaStatus.active_model})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Zap className="w-4 h-4" /> Local model unavailable
              </span>
            )}
          </div>
          <p className="text-indigo-200 text-[11px] leading-relaxed">
            {ollamaStatus?.message || 'Connecting to local AI service...'}
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Install the local model with <code className="bg-black/40 px-1.5 py-0.5 rounded text-indigo-300">ollama pull llama3.2</code>, then keep the Ollama service running.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
            >
              {savingPassword && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
