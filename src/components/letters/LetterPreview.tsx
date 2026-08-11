// Branded, print-ready letter preview component

interface Letter {
  recipientName: string;
  recipientAddress?: string;
  subject?: string;
  reference?: string;
  issueDate: string;
  content: string;
}

interface LetterPreviewProps {
  letter: Letter;
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
    businessName?: string;
    businessAddress?: string;
    businessEmail?: string;
    businessPhone?: string;
  };
}

export default function LetterPreview({ letter, branding }: LetterPreviewProps) {
  const primary = branding?.primaryColor ?? '#0f172a';
  const bg      = branding?.backgroundColor ?? '#ffffff';
  const text    = branding?.textColor ?? '#020617';

  return (
    <div
      id="letter-preview"
      className="w-full rounded-xl shadow-lg print:shadow-none print:rounded-none min-h-[1056px] flex flex-col"
      style={{ backgroundColor: bg, color: text, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header Band */}
      <div className="px-12 py-10 flex justify-between items-start" style={{ borderBottom: `3px solid ${primary}` }}>
        <div>
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-16 object-contain mb-2" />
          ) : (
            <div className="text-3xl font-bold" style={{ color: primary }}>
              {branding?.businessName ?? 'Your Business'}
            </div>
          )}
        </div>
        <div className="text-right text-sm space-y-0.5 mt-2" style={{ color: text + 'cc' }}>
          {branding?.businessAddress && <p>{branding.businessAddress}</p>}
          {branding?.businessEmail && <p>{branding.businessEmail}</p>}
          {branding?.businessPhone && <p>{branding.businessPhone}</p>}
        </div>
      </div>

      {/* Meta (Date, Ref) */}
      <div className="px-12 pt-10 pb-6 flex justify-between text-sm">
        <div style={{ color: text + 'cc' }}>
          {letter.issueDate}
        </div>
        {letter.reference && (
          <div style={{ color: text + 'cc' }}>
            <span className="font-semibold uppercase tracking-wider text-xs mr-2" style={{ color: primary }}>Ref</span>
            {letter.reference}
          </div>
        )}
      </div>

      {/* Recipient */}
      <div className="px-12 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: primary }}>
          To
        </p>
        <p className="font-semibold text-lg">{letter.recipientName}</p>
        {letter.recipientAddress && (
          <p className="text-sm mt-1 whitespace-pre-line" style={{ color: text + 'cc' }}>
            {letter.recipientAddress}
          </p>
        )}
      </div>

      {/* Subject */}
      {letter.subject && (
        <div className="px-12 pb-8">
          <p className="font-bold text-lg underline underline-offset-4" style={{ color: primary }}>
            Re: {letter.subject}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-12 flex-grow pb-16">
        <div
          className="whitespace-pre-wrap leading-relaxed text-[15px]"
          style={{ color: text + 'e6', fontFamily: 'Georgia, serif' }}
        >
          {letter.content}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-12 py-4 text-center text-xs mt-auto"
        style={{ backgroundColor: primary, color: '#fff' + 'cc' }}
      >
        {branding?.businessName ?? 'InvoiceHub'} — Business Correspondence
      </div>
    </div>
  );
}
