import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LetterPreview from '@/components/letters/LetterPreview';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';

type LetterStatus = 'draft' | 'sent';

const STATUS_STYLES: Record<LetterStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent:  'bg-emerald-100 text-emerald-700',
};

export default function LetterDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateAndUpload, isGenerating } = useGeneratePDF();

  const { data: letter, isLoading } = useQuery({
    queryKey: ['letter', id],
    queryFn: async () => {
      const res = await fetch(`/api/letters/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!session && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/letters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      navigate('/app/letters');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/letters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['letter', id] }),
  });

  const handleDownloadPDF = async () => {
    try {
      const url = await generateAndUpload({
        elementId: 'letter-preview',
        docId: id!,
        docType: 'letter',
        filename: `letter-${id}.pdf`,
      });
      window.open(url, '_blank');
    } catch {
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-800 border-t-transparent" />
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Letter not found.</p>
        <Link to="/app/letters" className="text-gray-800 hover:underline mt-4 block">← Back to letters</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app/letters" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Letters
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium">{letter.recipientName}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[letter.status as LetterStatus]}`}>
            {letter.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {letter.status === 'draft' && (
            <Button
              variant="outline"
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => updateStatus.mutate('sent')}
              disabled={updateStatus.isPending}
            >
              ✓ Mark as Sent
            </Button>
          )}

          <Button variant="outline" onClick={handlePrint}>🖨️ Print</Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generating...' : '📥 Download PDF'}
          </Button>
          {letter.pdfUrl && (
            <a href={letter.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                🔗 View Last PDF
              </Button>
            </a>
          )}
          <Link to={`/app/letters/${id}/edit`}>
            <Button variant="outline">✏️ Edit</Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { if (confirm('Delete this letter?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div id="letter-preview">
         <LetterPreview letter={letter} />
      </div>
    </div>
  );
}
