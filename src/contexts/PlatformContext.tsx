import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface PlatformSettings {
  siteName: string;
  contactEmail?: string;
}

interface PlatformContextType {
  settings: PlatformSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  siteName: 'InvoicePoint',
};

const PlatformContext = createContext<PlatformContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/platform/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          siteName: data.siteName || 'InvoicePoint',
          contactEmail: data.contactEmail,
        });
        document.title = data.siteName || 'InvoicePoint';
      }
    } catch (error) {
      console.error('Failed to fetch platform settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <PlatformContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
