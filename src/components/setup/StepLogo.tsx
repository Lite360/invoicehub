import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function StepLogo({ data, updateData }: { data: string, updateData: (data: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Show instant local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
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
      setLocalPreview(null); // Clear local preview once we have the real URL
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
      setLocalPreview(null); // Revert preview on failure
    } finally {
      setUploading(false);
    }
  };

  const displayImage = localPreview || data;

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div>
        <h2 className="text-xl font-semibold mb-2">Company Logo</h2>
        <p className="text-gray-500 mb-6">Upload your business logo to brand your documents.</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
          {displayImage ? (
            <>
              <img src={displayImage} alt="Logo Preview" className={`w-full h-full object-contain transition-opacity duration-300 ${uploading ? 'opacity-50' : 'opacity-100'}`} />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
                </div>
              )}
            </>
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
