import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LetterForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isEdit && session) {
      setLoading(true);
      fetch(`/api/letters/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
        .then(r => r.json())
        .then(data => {
          setRecipientName(data.recipientName ?? '');
          setRecipientAddress(data.recipientAddress ?? '');
          setSubject(data.subject ?? '');
          setReference(data.reference ?? '');
          setIssueDate(data.issueDate ?? '');
          setContent(data.content ?? '');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, session]);

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    const payload = {
      recipientName, recipientAddress, subject, reference, issueDate, content, status
    };

    try {
      const url = isEdit ? `/api/letters/${id}` : '/api/letters';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save letter');
      const saved = await res.json();
      navigate(`/app/letters/${saved.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Letter' : 'New Letter'}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</Button>
          <Button onClick={() => handleSave('sent')} disabled={saving} className="bg-gray-800 hover:bg-gray-900">
            {saving ? 'Saving...' : 'Save & Send'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-8">
        {/* Letter Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reference Number (Optional)</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="REF-001" />
          </div>
        </div>

        {/* Recipient Info */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Recipient</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Recipient Name *</Label>
              <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Recipient Address</Label>
              <textarea
                value={recipientAddress}
                onChange={e => setRecipientAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Letter Content</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject of the letter" />
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                rows={15}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-800 font-serif"
                placeholder="Dear Sir/Madam,&#10;&#10;Write your letter content here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
