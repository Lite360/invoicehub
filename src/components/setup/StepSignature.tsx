import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export default function StepSignature({ data, updateData }: { data: any, updateData: (data: any) => void }) {
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processSignatureImage = (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Basic luma filter: if pixel is bright/white, make it transparent
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          // Calculate perceived brightness
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          if (luma > 200) { // Threshold for white background
            pixels[i + 3] = 0; // Alpha to 0
          } else {
            // Darken strokes to black (improving contrast)
            pixels[i] = 0;
            pixels[i + 1] = 0;
            pixels[i + 2] = 0;
            pixels[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert canvas back to blob and upload
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token || '';

            const newBlob = await upload(`signature-${Date.now()}.png`, blob, {
              access: 'public',
              handleUploadUrl: '/api/upload',
              clientPayload: token,
            });

            updateData({ ...data, url: newBlob.url, type: 'upload' });
          } catch (error) {
            console.error(error);
            alert('Signature upload failed.');
          } finally {
            setUploading(false);
          }
        }, 'image/png');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Digital Signature</h2>
        <p className="text-gray-500 mb-6">Add your signature to make your documents official.</p>
      </div>

      <div className="flex gap-4 mb-6 border-b pb-4">
        <Button 
          variant={data.type === 'type' ? 'default' : 'outline'}
          onClick={() => updateData({ ...data, type: 'type' })}
        >
          Type Signature
        </Button>
        <Button 
          variant={data.type === 'upload' ? 'default' : 'outline'}
          onClick={() => updateData({ ...data, type: 'upload' })}
        >
          Upload Signature
        </Button>
      </div>

      {data.type === 'type' ? (
        <div className="space-y-4">
          <Label htmlFor="signatureText">Type your full name</Label>
          <Input 
            id="signatureText" 
            value={data.text} 
            onChange={(e) => updateData({ ...data, text: e.target.value })} 
            placeholder="John Doe"
          />
          <div className="mt-4 p-8 border rounded-lg bg-gray-50 flex items-center justify-center">
            {/* Using a generic cursive-like serif for MVP typed signature */}
            <span className="text-4xl italic font-serif" style={{ fontFamily: 'Brush Script MT, cursive, serif' }}>
              {data.text || 'Your Signature'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-500 text-left">Upload a clear photo of your signature on white paper. We will automatically remove the background.</p>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processSignatureImage(e.target.files[0]);
              }
            }}
          />
          
          <div className="mt-4 p-4 border-2 border-dashed rounded-lg bg-gray-50 flex items-center justify-center min-h-[150px]">
            {uploading ? (
              <span className="text-gray-400">Processing and uploading...</span>
            ) : data.url ? (
              <img src={data.url} alt="Processed Signature" className="max-h-32 object-contain" />
            ) : (
              <span className="text-gray-400">Preview will appear here</span>
            )}
          </div>
          {/* Hidden canvas used for image processing */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}
    </div>
  );
}
