import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface GeneratePDFOptions {
  elementId: string;
  docId: string;
  docType: 'invoice' | 'quotation' | 'receipt' | 'letter';
  filename: string;
}

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const generateAndUpload = async ({ elementId, docId, docType, filename }: GeneratePDFOptions) => {
    try {
      setIsGenerating(true);
      const element = document.getElementById(elementId);
      if (!element) throw new Error(`Element ${elementId} not found`);

      // 1. Generate PDF as Base64 string
      const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      const pdfBase64 = await html2pdf().from(element).set(opt).outputPdf('datauristring');

      // 2. Upload to Vercel Blob via API
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          docId,
          docType,
          filename,
          pdfBase64,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload PDF');
      }

      const data = await res.json();
      
      // Invalidate relevant query to fetch the new pdfUrl
      queryClient.invalidateQueries({ queryKey: [docType, docId] });

      return data.url;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateAndUpload, isGenerating };
}
