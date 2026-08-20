import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Tab = 'profile' | 'business' | 'branding';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'business', label: 'Company', icon: '🏢' },
  { key: 'branding', label: 'Branding', icon: '🎨' },
];

async function fetchSettings(token: string) {
  const res = await fetch('/api/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export default function SettingsPage() {
  const { session, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchSettings(session?.access_token ?? ''),
    enabled: !!session,
  });

  // --- Profile State ---
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // --- Business State ---
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizRegNum, setBizRegNum] = useState('');
  const [bizTaxId, setBizTaxId] = useState('');
  const [bizCurrency, setBizCurrency] = useState('NGN');

  // --- Branding State ---
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [secondaryColor, setSecondaryColor] = useState('#334155');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#020617');

  useEffect(() => {
    if (data) {
      // Profile
      setFullName(data.profile?.fullName ?? '');
      setPhoneNumber(data.profile?.phoneNumber ?? '');
      // Business
      setBizName(data.business?.name ?? '');
      setBizType(data.business?.type ?? '');
      setBizEmail(data.business?.email ?? '');
      setBizPhone(data.business?.phone ?? '');
      setBizAddress(data.business?.address ?? '');
      setBizWebsite(data.business?.website ?? '');
      setBizRegNum(data.business?.registrationNumber ?? '');
      setBizTaxId(data.business?.taxId ?? '');
      setBizCurrency(data.business?.currency ?? 'NGN');
      // Branding
      setPrimaryColor(data.branding?.primaryColor ?? '#0f172a');
      setSecondaryColor(data.branding?.secondaryColor ?? '#334155');
      setAccentColor(data.branding?.accentColor ?? '#3b82f6');
      setBackgroundColor(data.branding?.backgroundColor ?? '#ffffff');
      setTextColor(data.branding?.textColor ?? '#020617');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async ({ section, payload }: { section: string; payload: any }) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ section, data: payload }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const saveProfile = () => saveMutation.mutate({ section: 'profile', payload: { fullName, phoneNumber } });
  const saveBusiness = () => saveMutation.mutate({
    section: 'business',
    payload: {
      name: bizName, type: bizType, email: bizEmail, phone: bizPhone,
      address: bizAddress, website: bizWebsite, registrationNumber: bizRegNum,
      taxId: bizTaxId, currency: bizCurrency,
    },
  });
  const saveBranding = () => saveMutation.mutate({
    section: 'branding',
    payload: { primaryColor, secondaryColor, accentColor, backgroundColor, textColor },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Your Profile</h2>
              <p className="text-sm text-gray-500">Manage your personal account information.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={data?.profile?.email ?? ''} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-400">Email cannot be changed here.</p>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                onClick={saveProfile}
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={signOut}>
                🚪 Sign Out
              </Button>
            </div>
          </>
        )}

        {/* BUSINESS TAB */}
        {activeTab === 'business' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Company Information</h2>
              <p className="text-sm text-gray-500">This info appears on all your documents.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={bizName} onChange={(e) => setBizName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Input value={bizType} onChange={(e) => setBizType(e.target.value)} placeholder="e.g. LLC, Sole Proprietor" />
              </div>
              <div className="space-y-2">
                <Label>Business Email</Label>
                <Input type="email" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Business Phone</Label>
                <Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <textarea
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={bizWebsite} onChange={(e) => setBizWebsite(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Input value={bizCurrency} onChange={(e) => setBizCurrency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input value={bizRegNum} onChange={(e) => setBizRegNum(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={bizTaxId} onChange={(e) => setBizTaxId(e.target.value)} />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button
                onClick={saveBusiness}
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Company Info'}
              </Button>
            </div>
          </>
        )}

        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Brand Colors</h2>
              <p className="text-sm text-gray-500">Customize the colors used on your documents.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Primary Color', value: primaryColor, setter: setPrimaryColor },
                { label: 'Secondary Color', value: secondaryColor, setter: setSecondaryColor },
                { label: 'Accent Color', value: accentColor, setter: setAccentColor },
                { label: 'Background Color', value: backgroundColor, setter: setBackgroundColor },
                { label: 'Text Color', value: textColor, setter: setTextColor },
              ].map((c) => (
                <div key={c.label} className="space-y-2">
                  <Label>{c.label}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={c.value}
                      onChange={(e) => c.setter(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={c.value}
                      onChange={(e) => c.setter(e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Preview */}
            <div className="mt-6">
              <Label className="mb-3 block">Live Preview</Label>
              <div
                className="rounded-xl p-6 border"
                style={{ backgroundColor, color: textColor, borderColor: primaryColor }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: primaryColor }} />
                  <div>
                    <p className="font-bold text-lg" style={{ color: primaryColor }}>
                      {bizName || 'Your Business'}
                    </p>
                    <p className="text-xs" style={{ color: secondaryColor }}>Invoice #INV-00001</p>
                  </div>
                </div>
                <div className="h-px mb-4" style={{ backgroundColor: accentColor }} />
                <p className="text-sm" style={{ color: textColor }}>
                  This is a preview of how your documents will look with these brand colors.
                </p>
                <div
                  className="mt-4 px-4 py-2 rounded-lg inline-block text-white text-sm font-medium"
                  style={{ backgroundColor: accentColor }}
                >
                  Pay Now
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={saveBranding}
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Branding'}
              </Button>
            </div>
          </>
        )}

        {/* Success message */}
        {saveMutation.isSuccess && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
            ✓ Settings saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}
