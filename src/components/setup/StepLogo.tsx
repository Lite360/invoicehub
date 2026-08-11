import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function StepLogo({ data, updateData }: { data: string, updateData: (data: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: token, // Pass auth token inside clientPayload so server can verify
      });
      
      updateData(newBlob.url);
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div>
        <h2 className="text-xl font-semibold mb-2">Company Logo</h2>
        <p className="text-gray-500 mb-6">Upload your business logo to brand your documents.</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
          {data ? (
            <img src={data} alt="Logo Preview" className="w-full h-full object-contain" />
          ) : (
            <span className="text-gray-400">No logo</span>
          )}
        </div>

        <input 
          type="file" 
          accept="image/png, image/jpeg, image/webp" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleUpload}
        />

        <Button 
          type="button" 
          variant="outline" 
          disabled={uploading} 
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Uploading...' : (data ? 'Change Logo' : 'Upload Logo')}
        </Button>
      </div>
    </div>
  );
}
