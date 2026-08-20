
const TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Clean, minimal design with bold headers' },
  { id: 'classic', name: 'Classic', description: 'Traditional layout with a professional feel' },
  { id: 'professional', name: 'Professional', description: 'Corporate style with structured sections' },
  { id: 'minimal', name: 'Minimal', description: 'Ultra-clean with generous whitespace' },
  { id: 'corporate', name: 'Corporate', description: 'Formal layout suited for enterprises' },
];

interface StepTemplateProps {
  data: string;
  updateData: (data: string) => void;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  logoUrl: string;
}

export default function StepTemplate({ data, updateData, brandColors, logoUrl }: StepTemplateProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Default Template</h2>
        <p className="text-gray-500 mb-6">Choose the default layout for your documents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            onClick={() => updateData(template.id)}
            className={`cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${
              data === template.id
                ? 'border-emerald-600 ring-2 ring-emerald-200'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {/* Template Mini-Preview */}
            <div
              className="h-40 rounded-t-lg p-3 overflow-hidden"
              style={{ backgroundColor: brandColors.background }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
                  ) : (
                    <div className="w-12 h-3 rounded" style={{ backgroundColor: brandColors.primary }} />
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-bold uppercase tracking-wide ${template.id === 'minimal' ? 'text-xs' : 'text-sm'}`}
                    style={{ color: brandColors.primary }}
                  >
                    INVOICE
                  </div>
                </div>
              </div>
              {/* Content Lines */}
              <div className="mt-3 space-y-1">
                <div className="h-1.5 w-3/4 rounded opacity-30" style={{ backgroundColor: brandColors.text }} />
                <div className="h-1.5 w-1/2 rounded opacity-20" style={{ backgroundColor: brandColors.text }} />
              </div>
              {/* Body */}
              <div className="mt-3 space-y-1">
                <div className="h-1 w-full rounded opacity-10" style={{ backgroundColor: brandColors.text }} />
                <div className="h-1 w-full rounded opacity-10" style={{ backgroundColor: brandColors.text }} />
                <div className="h-1 w-3/4 rounded opacity-10" style={{ backgroundColor: brandColors.text }} />
              </div>
              {/* Footer */}
              <div className="mt-3 flex justify-between items-center pt-2 border-t" style={{ borderColor: brandColors.secondary + '44' }}>
                <div className="h-1.5 w-1/4 rounded opacity-20" style={{ backgroundColor: brandColors.text }} />
                <div className="h-1.5 w-1/4 rounded" style={{ backgroundColor: brandColors.accent }} />
              </div>
            </div>

            <div className="p-3 bg-white rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
                {data === template.id && (
                  <span className="text-emerald-600 text-xs font-medium">✓ Selected</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
