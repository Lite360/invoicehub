import { useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Shared Form State
  const [businessInfo, setBusinessInfo] = useState({});
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColors, setBrandColors] = useState({
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#020617',
  });
  const [signature, setSignature] = useState({ type: 'upload', text: '', url: '' });
  const [watermark, setWatermark] = useState({ enabled: false, type: 'text', text: '', opacity: 10, position: 'center', rotation: -45 });
  const [defaultTemplate, setDefaultTemplate] = useState('modern');

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
         throw new Error('Failed to save setup');
      }

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
