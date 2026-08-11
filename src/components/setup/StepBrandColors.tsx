import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StepBrandColors({ data, updateData }: { data: any, updateData: (data: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-10">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Brand Colors</h2>
          <p className="text-gray-500 mb-6">Choose the colors that match your company identity.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input type="color" name="primary" id="primary" value={data.primary} onChange={handleChange} className="w-14 h-14 p-1 cursor-pointer" />
            <div className="flex-1">
              <Label htmlFor="primary">Primary Color</Label>
              <Input type="text" name="primary" value={data.primary} onChange={handleChange} className="font-mono mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input type="color" name="secondary" id="secondary" value={data.secondary} onChange={handleChange} className="w-14 h-14 p-1 cursor-pointer" />
            <div className="flex-1">
              <Label htmlFor="secondary">Secondary Color</Label>
              <Input type="text" name="secondary" value={data.secondary} onChange={handleChange} className="font-mono mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input type="color" name="accent" id="accent" value={data.accent} onChange={handleChange} className="w-14 h-14 p-1 cursor-pointer" />
            <div className="flex-1">
              <Label htmlFor="accent">Accent Color</Label>
              <Input type="text" name="accent" value={data.accent} onChange={handleChange} className="font-mono mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input type="color" name="background" id="background" value={data.background} onChange={handleChange} className="w-14 h-14 p-1 cursor-pointer" />
            <div className="flex-1">
              <Label htmlFor="background">Background Color</Label>
              <Input type="text" name="background" value={data.background} onChange={handleChange} className="font-mono mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input type="color" name="text" id="text" value={data.text} onChange={handleChange} className="w-14 h-14 p-1 cursor-pointer" />
            <div className="flex-1">
              <Label htmlFor="text">Text Color</Label>
              <Input type="text" name="text" value={data.text} onChange={handleChange} className="font-mono mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
        {/* Live Preview Mockup */}
        <div
          className="w-full max-w-sm rounded shadow-lg overflow-hidden border"
          style={{ backgroundColor: data.background, color: data.text }}
        >
          <div className="p-4 border-b" style={{ borderColor: data.secondary }}>
            <h3 className="font-bold text-lg" style={{ color: data.primary }}>INVOICE</h3>
            <p className="text-sm opacity-80">Mockup preview</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="h-4 w-1/2 rounded" style={{ backgroundColor: data.secondary, opacity: 0.2 }}></div>
            <div className="h-4 w-full rounded" style={{ backgroundColor: data.secondary, opacity: 0.2 }}></div>
            <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: data.secondary }}>
              <span className="font-bold">Total:</span>
              <span className="font-bold" style={{ color: data.accent }}>$1,200.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
