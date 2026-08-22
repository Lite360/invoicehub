import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

import StepBusinessInfo from '@/components/setup/StepBusinessInfo';
import StepLogo from '@/components/setup/StepLogo';
import StepBrandColors from '@/components/setup/StepBrandColors';
import StepSignature from '@/components/setup/StepSignature';
import StepWatermark from '@/components/setup/StepWatermark';
import StepTemplate from '@/components/setup/StepTemplate';

export default function CompanySetupWizard() {
  const [currentStep, setCurrentStep] = useState(() => Number(localStorage.getItem('setup_currentStep')) || 1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Shared Form State
  const [businessInfo, setBusinessInfo] = useState(() => JSON.parse(localStorage.getItem('setup_businessInfo') || '{}'));
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('setup_logoUrl') || '');
  const [brandColors, setBrandColors] = useState(() => JSON.parse(localStorage.getItem('setup_brandColors') || 'null') || {
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#020617',
  });
  const [signature, setSignature] = useState(() => JSON.parse(localStorage.getItem('setup_signature') || 'null') || { type: 'upload', text: '', url: '' });
  const [watermark, setWatermark] = useState(() => JSON.parse(localStorage.getItem('setup_watermark') || 'null') || { enabled: false, type: 'text', text: '', opacity: 10, position: 'center', rotation: -45 });
  const [defaultTemplate, setDefaultTemplate] = useState(() => localStorage.getItem('setup_defaultTemplate') || 'modern');

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('setup_currentStep', currentStep.toString()); }, [currentStep]);
  useEffect(() => { localStorage.setItem('setup_businessInfo', JSON.stringify(businessInfo)); }, [businessInfo]);
  useEffect(() => { localStorage.setItem('setup_logoUrl', logoUrl); }, [logoUrl]);
  useEffect(() => { localStorage.setItem('setup_brandColors', JSON.stringify(brandColors)); }, [brandColors]);
  useEffect(() => { localStorage.setItem('setup_signature', JSON.stringify(signature)); }, [signature]);
  useEffect(() => { localStorage.setItem('setup_watermark', JSON.stringify(watermark)); }, [watermark]);
  useEffect(() => { localStorage.setItem('setup_defaultTemplate', defaultTemplate); }, [defaultTemplate]);


  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/businesses/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessInfo,
          logoUrl,
          brandColors,
          signature,
          watermark,
          defaultTemplate,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save setup');
      }

      // Clear local storage
      const keysToRemove = ['setup_currentStep', 'setup_businessInfo', 'setup_logoUrl', 'setup_brandColors', 'setup_signature', 'setup_watermark', 'setup_defaultTemplate'];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      navigate('/app/dashboard');
    } catch (error) {
      console.error(error);
      alert('Error saving setup: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Company Setup</h1>
        <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
      </div>

      <Card className="w-full max-w-4xl min-h-[600px] flex flex-col">
        <CardContent className="flex-grow p-6">
          {currentStep === 1 && <StepBusinessInfo data={businessInfo} updateData={setBusinessInfo} />}
          {currentStep === 2 && <StepLogo data={logoUrl} updateData={setLogoUrl} />}
          {currentStep === 3 && <StepBrandColors data={brandColors} updateData={setBrandColors} />}
          {currentStep === 4 && <StepSignature data={signature} updateData={setSignature} />}
          {currentStep === 5 && <StepWatermark data={watermark} updateData={setWatermark} />}
          {currentStep === 6 && <StepTemplate data={defaultTemplate} updateData={setDefaultTemplate} brandColors={brandColors} logoUrl={logoUrl} />}
        </CardContent>
        <CardFooter className="flex justify-between p-6 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || loading}>
            Back
          </Button>
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
