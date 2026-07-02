'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { 
  User as UserIcon, Shield, CreditCard, Bell, Key, Trash2, 
  Globe, Link as LinkIcon, Facebook, Instagram, Camera, 
  Loader2, Check, AlertCircle, ShoppingCart, Heart, LogOut
} from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkSession, logout } = useAuth();
  
  // Tabs: 'profile', 'photo', 'security', 'subscriptions', 'payment', 'privacy', 'notifications', 'api', 'close'
  const activeTabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  useEffect(() => {
    setActiveTab(activeTabParam);
  }, [activeTabParam]);

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [biography, setBiography] = useState('');
  const [language, setLanguage] = useState('English');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Security Form States
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status/Messages
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Loaded Data
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  // Load profile and related data
  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Load Profile
      const profileRes = await api.get('/users/me/profile');
      const profile = profileRes.data;
      
      // Parse first/last name
      const nameParts = (profile.name || '').trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      
      setHeadline(profile.headline || '');
      setBiography(profile.biography || '');
      setLanguage(profile.language || 'English');
      setWebsiteUrl(profile.websiteUrl || '');
      setFacebookUrl(profile.facebookUrl || '');
      setInstagramUrl(profile.instagramUrl || '');
      setAvatarUrl(profile.avatarUrl || '');
      setEmail(profile.email || '');

      // 2. Load Payment Methods
      const pmRes = await api.get('/users/me/payment-methods');
      setPaymentMethods(pmRes.data || []);

      // 3. Load Subscriptions
      const subRes = await api.get('/users/me/subscriptions');
      setSubscription(subRes.data);

    } catch (err: any) {
      setErrorMsg('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      router.push('/login?redirect=/user/settings');
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.put('/users/me/profile', {
        firstName,
        lastName,
        headline,
        biography,
        language,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        avatarUrl
      });
      setSuccessMsg('Profile updated successfully!');
      useAuth.setState((state) => ({
        user: state.user ? { ...state.user, ...response.data } : response.data
      }));
      checkSession(); // sync changes in Navbar
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/me/security', {
        email,
        currentPassword,
        newPassword
      });
      setSuccessMsg('Security settings updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      checkSession();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update security credentials.');
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAvatarChange = async (url: string) => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.put('/users/me/profile', { avatarUrl: url });
      setAvatarUrl(url);
      setSuccessMsg('Avatar updated successfully!');
      useAuth.setState((state) => ({
        user: state.user ? { ...state.user, ...response.data } : response.data
      }));
      checkSession();
    } catch (err) {
      setErrorMsg('Failed to update avatar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAccount = async () => {
    if (confirm('Are you absolutely sure you want to close your account? This action is permanent and cannot be undone.')) {
      setSaving(true);
      try {
        // Log out immediately
        await logout();
        router.push('/');
      } catch (err) {
        setErrorMsg('Failed to close account.');
        setSaving(false);
      }
    }
  };

  if (!user || loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-40 bg-brand-bg/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-brand-charcoal animate-spin" />
          <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Predefined avatar selections
  const avatarTemplates = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop'
  ];

  return (
    <div className="max-w-[1140px] mx-auto w-full px-6 py-12 flex-grow bg-white">
      
      {/* Messages */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-[260px] shrink-0 border border-brand-grey rounded-[4px] bg-white overflow-hidden select-none">
          <div className="p-6 text-center border-b border-brand-grey bg-[#F7F9FA]">
            <div className="w-[100px] h-[100px] rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-3xl mx-auto overflow-hidden shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
              )}
            </div>
            <h2 className="font-extrabold text-sm text-brand-charcoal mt-4 truncate">{user.name}</h2>
            <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{user.email}</p>
          </div>

          <nav className="flex flex-col text-xs font-semibold text-brand-charcoal divide-y divide-brand-grey">
            <button
              onClick={() => router.push(`/user/settings?tab=profile`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'profile' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <UserIcon className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=photo`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'photo' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Camera className="w-4 h-4" /> Photo
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=security`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'security' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Shield className="w-4 h-4" /> Account Security
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=subscriptions`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'subscriptions' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Check className="w-4 h-4" /> Subscriptions
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=payment`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'payment' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <CreditCard className="w-4 h-4" /> Payment methods
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=privacy`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'privacy' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-600" /> Privacy
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=notifications`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'notifications' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Bell className="w-4 h-4" /> Notification Preferences
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=api`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'api' ? 'bg-brand-bg text-brand-charcoal border-l-[3px] border-brand-charcoal font-extrabold' : ''
              }`}
            >
              <Key className="w-4 h-4" /> API clients
            </button>
            <button
              onClick={() => router.push(`/user/settings?tab=close`)}
              className={`w-full text-left px-5 py-3 hover:bg-brand-bg text-red-600 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'close' ? 'bg-brand-bg text-red-600 border-l-[3px] border-red-600 font-extrabold' : ''
              }`}
            >
              <Trash2 className="w-4 h-4" /> Close account
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-grow w-full border border-brand-grey rounded-[4px] p-8 bg-white min-h-[500px]">
          
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Public profile</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Add information about yourself</p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider mb-3">Basics:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">First Name</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Headline</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Instructor at EduFlow, Software Engineer, Architect"
                    className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                  />
                  <span className="text-[10px] text-gray-500 font-medium">Add a professional headline like, "Instructor at EduFlow" or "Architect."</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Biography</label>
                  <div className="border border-brand-charcoal rounded-[4px] overflow-hidden">
                    <div className="bg-brand-bg/50 px-3 py-1.5 border-b border-brand-grey flex items-center gap-3 text-xs text-gray-500 font-semibold select-none">
                      <button type="button" className="font-extrabold hover:text-brand-charcoal border-none bg-transparent cursor-pointer">B</button>
                      <button type="button" className="italic hover:text-brand-charcoal border-none bg-transparent cursor-pointer">I</button>
                    </div>
                    <textarea 
                      value={biography}
                      onChange={(e) => setBiography(e.target.value)}
                      placeholder="Write your biography..."
                      rows={5}
                      className="w-full px-3 py-2 text-xs font-medium text-brand-charcoal bg-white focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Links and coupon codes are not permitted in this section.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Language</label>
                  <div className="relative w-fit min-w-[200px]">
                    <Globe className="w-4 h-4 text-brand-charcoal absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="h-[40px] w-full border border-brand-charcoal rounded-[4px] pl-9 pr-8 text-xs font-bold text-brand-charcoal bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                    >
                      <option value="English">English (US)</option>
                      <option value="Español">Español (ES)</option>
                      <option value="Türkçe">Türkçe (TR)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-brand-grey">
                  <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Links:</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Website</label>
                      <div className="relative">
                        <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text" 
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="Website (http://...)"
                          className="h-[40px] w-full border border-brand-charcoal rounded-[4px] pl-9 pr-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Facebook</label>
                      <div className="flex border border-brand-charcoal rounded-[4px] overflow-hidden focus-within:ring-1 focus-within:ring-brand-charcoal">
                        <span className="bg-[#F7F9FA] px-3 flex items-center text-xs font-semibold text-gray-500 border-r border-brand-grey shrink-0 select-none">
                          facebook.com/
                        </span>
                        <input 
                          type="text" 
                          value={facebookUrl}
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="Username"
                          className="h-[40px] flex-grow px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none border-none"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">Input your Facebook username (e.g. johnsmith).</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Instagram</label>
                      <div className="flex border border-brand-charcoal rounded-[4px] overflow-hidden focus-within:ring-1 focus-within:ring-brand-charcoal">
                        <span className="bg-[#F7F9FA] px-3 flex items-center text-xs font-semibold text-gray-500 border-r border-brand-grey shrink-0 select-none">
                          instagram.com/
                        </span>
                        <input 
                          type="text" 
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          placeholder="Username"
                          className="h-[40px] flex-grow px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none border-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="h-[40px] px-6 bg-brand-charcoal text-white hover:bg-brand-charcoal-hover font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border-none rounded-[4px] disabled:bg-gray-300"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Photo Tab */}
          {activeTab === 'photo' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Profile photo</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Select an avatar template or enter a custom image URL</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Current Avatar preview */}
                <div className="w-[120px] h-[120px] rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-4xl overflow-hidden border border-brand-grey shadow-md shrink-0 mx-auto md:mx-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    user.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)
                  )}
                </div>

                <div className="flex-grow space-y-6">
                  {/* Option A: Default Avatar templates */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Choose from Template Avatars:</h3>
                    <div className="flex flex-wrap gap-3">
                      {avatarTemplates.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => handleAvatarChange(url)}
                          className={`w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
                            avatarUrl === url ? 'border-brand-charcoal' : 'border-transparent'
                          }`}
                        >
                          <img src={url} alt={`Template ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option B: Custom Avatar URL */}
                  <div className="space-y-2 border-t border-brand-grey pt-4">
                    <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Or Use a Custom Image URL:</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="h-[40px] flex-grow border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                      />
                      <button 
                        onClick={() => handleAvatarChange(avatarUrl)}
                        disabled={saving}
                        className="h-[40px] px-4 bg-brand-charcoal hover:bg-brand-charcoal-hover text-white text-xs font-bold rounded-[4px] cursor-pointer transition-colors border-none disabled:bg-gray-300 shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Account Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Account Security</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Change your login email or update your password</p>
              </div>

              <form onSubmit={handleSecuritySave} className="space-y-6 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                    required
                  />
                </div>

                <hr className="border-t border-brand-grey my-6" />

                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Change Password:</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required to change password"
                      className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#1c1d1f] uppercase">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="h-[40px] w-full border border-brand-charcoal rounded-[4px] px-3 text-xs font-semibold text-brand-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-brand-charcoal"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="h-[40px] px-6 bg-brand-charcoal text-white hover:bg-brand-charcoal-hover font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border-none rounded-[4px] disabled:bg-gray-300"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save security details'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Subscriptions</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage your active learning plans</p>
              </div>

              {subscription && subscription.active ? (
                <div className="border border-brand-grey bg-brand-bg/50 rounded-md p-6 space-y-4 max-w-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                        {subscription.status}
                      </span>
                      <h3 className="font-extrabold text-base text-brand-charcoal mt-2">{subscription.plan}</h3>
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Subscribed since: {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-extrabold text-base text-brand-charcoal">
                      ₹{subscription.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 leading-relaxed font-semibold">
                    You have unlocked unlimited access to over 28,000 top courses, hands-on learning labs, and personal track pathways.
                  </div>

                  <div className="pt-4 flex gap-4 select-none">
                    <button 
                      onClick={() => alert('Billing settings page is loading...')}
                      className="h-[36px] px-4 border border-brand-charcoal text-brand-charcoal text-xs font-bold hover:bg-brand-bg/5 rounded-[4px] bg-white cursor-pointer"
                    >
                      Update Billing Info
                    </button>
                    <button 
                      onClick={() => alert('Subscription cancellation is locked for testing.')}
                      className="h-[36px] px-4 text-red-600 hover:text-red-700 text-xs font-bold bg-transparent border-none cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-brand-grey border-dashed rounded-[4px] text-center space-y-4 max-w-xl select-none">
                  <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-brand-charcoal">No active subscription plan</h3>
                    <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto leading-relaxed">
                      You aren't subscribed to Personal Plan. Gain access to 28,000+ top courses for software development, IT, and more.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/courses')}
                    className="h-[40px] px-6 bg-brand-charcoal text-white font-bold text-xs hover:bg-brand-charcoal-hover rounded-[4px] cursor-pointer border-none"
                  >
                    Explore Personal Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Payment Methods */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Saved Payment Methods</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Payment credentials associated with your recent purchases</p>
              </div>

              {paymentMethods.length > 0 ? (
                <div className="space-y-4 max-w-xl">
                  {paymentMethods.map((pm, i) => (
                    <div key={i} className="border border-brand-grey p-5 rounded-[4px] flex items-center justify-between bg-white shadow-sm hover:border-brand-charcoal transition-all select-none">
                      <div className="flex items-center gap-4">
                        <div className="w-[50px] h-[34px] rounded border border-gray-200 bg-gray-50 flex items-center justify-center italic text-xs font-black shrink-0 tracking-wider">
                          {pm.method}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-brand-charcoal">
                            {pm.method === 'CARD' ? 'Saved Credit Card' : 'UPI Account'}
                          </p>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            Details: {pm.details}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">
                        Used: {new Date(pm.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  <div className="p-4 bg-brand-bg border border-brand-grey rounded-[4px] text-xs text-gray-500 font-semibold leading-relaxed leading-5">
                    Saved payment methods are safely encrypted and handled directly by Razorpay secure channels. You can clear or update these details during checkout of a new order.
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-brand-grey border-dashed rounded-[4px] text-center space-y-4 max-w-xl select-none">
                  <CreditCard className="w-10 h-10 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-brand-charcoal">No payment methods on file</h3>
                    <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto leading-relaxed">
                      You haven't completed any course purchases yet. Purchase a course using a payment method to save it on file.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/courses')}
                    className="h-[40px] px-6 bg-brand-charcoal text-white font-bold text-xs hover:bg-brand-charcoal-hover rounded-[4px] cursor-pointer border-none"
                  >
                    Browse Catalog
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Purchase history</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Receipts and details of courses you have purchased</p>
              </div>

              {paymentMethods.length > 0 ? (
                <div className="space-y-4 max-w-2xl select-none">
                  {paymentMethods.map((pm, i) => (
                    <div key={i} className="border border-brand-grey p-5 rounded-[4px] bg-white space-y-3">
                      <div className="flex justify-between items-start border-b border-brand-grey pb-2.5">
                        <div>
                          <p className="text-xs font-bold text-brand-charcoal">Order ID: RCPT-{10200 + i}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Purchased on {new Date(pm.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-extrabold text-brand-charcoal bg-brand-bg px-2.5 py-1 rounded border border-brand-grey">
                          Payment: {pm.method}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-600">EduFlow Course Catalog Purchase</span>
                        <span className="font-extrabold text-brand-charcoal">Status: SUCCESS</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border border-brand-grey border-dashed rounded-[4px] text-center space-y-4 max-w-xl select-none">
                  <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-brand-charcoal">No purchase history</h3>
                    <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto leading-relaxed">
                      You haven't bought any premium courses yet.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/courses')}
                    className="h-[40px] px-6 bg-brand-charcoal text-white font-bold text-xs hover:bg-brand-charcoal-hover rounded-[4px] cursor-pointer border-none"
                  >
                    Find a Course
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Privacy settings</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Manage who can view your profile and enrolled courses</p>
              </div>

              <div className="space-y-6 max-w-xl select-none">
                <label className="flex items-start gap-3.5 p-4 border border-brand-grey rounded-[4px] cursor-pointer hover:bg-brand-bg/5">
                  <input type="checkbox" defaultChecked className="accent-brand-charcoal rounded-sm w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-brand-charcoal">Show profile to logged-in users</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Let other EduFlow users search and find your instructor dashboard and bio page.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3.5 p-4 border border-brand-grey rounded-[4px] cursor-pointer hover:bg-brand-bg/5">
                  <input type="checkbox" defaultChecked className="accent-brand-charcoal rounded-sm w-4 h-4 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-brand-charcoal">Show courses you're taking on your public profile</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Allow public visitors to see your active course certificates and progress metrics.</p>
                  </div>
                </label>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setSuccessMsg('Privacy preferences saved!');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-[40px] px-6 bg-brand-charcoal text-white hover:bg-brand-charcoal-hover font-bold text-xs rounded-[4px] cursor-pointer border-none"
                  >
                    Save Privacy Toggles
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Notifications</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Configure your email alerts and system messages</p>
              </div>

              <div className="space-y-6 max-w-xl select-none">
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-brand-charcoal uppercase tracking-wider">Email Announcements:</h3>
                  <label className="flex items-start gap-3.5">
                    <input type="checkbox" defaultChecked className="accent-brand-charcoal rounded-sm w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal">Promotional offers & discounts</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">Receive occasional alerts with coupons and recommendations for new courses.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3.5">
                    <input type="checkbox" defaultChecked className="accent-brand-charcoal rounded-sm w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal">Instructor announcements</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">Get emails from your instructors regarding supplementary course resources and updates.</p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-brand-grey">
                  <button 
                    onClick={() => {
                      setSuccessMsg('Notification parameters saved!');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-[40px] px-6 bg-brand-charcoal text-white hover:bg-brand-charcoal-hover font-bold text-xs rounded-[4px] cursor-pointer border-none"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: API clients */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal">Developer API credentials</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Generate API tokens for programmatic integrations</p>
              </div>

              <div className="space-y-4 max-w-xl select-none">
                <div className="p-4 bg-brand-bg border border-brand-grey rounded-[4px] space-y-2">
                  <p className="text-xs font-bold text-brand-charcoal">Generate a personal access token</p>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed leading-5">
                    Use tokens to authenticate requests against the EduFlow OpenAPI spec. Keep your keys secret: do not commit them directly in codebases.
                  </p>
                </div>
                
                <button 
                  onClick={() => alert('Generated mock API client token: eduflow_tok_7a184ffc8b419c8f62f3a')}
                  className="h-[40px] px-6 bg-brand-charcoal text-white hover:bg-brand-charcoal-hover font-bold text-xs rounded-[4px] cursor-pointer border-none"
                >
                  Generate Token
                </button>
              </div>
            </div>
          )}

          {/* TAB 10: Close Account */}
          {activeTab === 'close' && (
            <div className="space-y-6">
              <div className="border-b border-brand-grey pb-4">
                <h1 className="text-xl font-extrabold text-brand-charcoal text-red-600">Close Account</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Request immediate deactivation and deletion of your profile details</p>
              </div>

              <div className="border border-red-200 bg-red-50/30 p-6 rounded-md space-y-4 max-w-xl select-none">
                <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-wider">Warning:</h3>
                <p className="text-xs text-brand-charcoal leading-relaxed font-semibold">
                  Closing your account is permanent. You will immediately lose access to all enrolled courses, certificates of completion, and personal settings without option of recovery.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={handleCloseAccount}
                    className="h-[44px] px-6 bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer rounded-[4px] border-none"
                  >
                    Close Account Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-charcoal border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
