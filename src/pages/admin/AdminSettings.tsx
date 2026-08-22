import { useState, useEffect } from 'react';
import { usePlatform } from '@/contexts/PlatformContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  const { settings, refreshSettings } = usePlatform();
  const { showToast } = useToast();
  
  const [siteName, setSiteName] = useState(settings.siteName || '');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSiteName(settings.siteName || '');
    setContactEmail(settings.contactEmail || '');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/platform/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteName, contactEmail }),
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      await refreshSettings();
      showToast('Settings saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure global application settings and branding.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">General Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. InvoicePoint"
                />
                <p className="text-xs text-gray-500">This will be displayed on the login page and public areas.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="support@example.com"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
