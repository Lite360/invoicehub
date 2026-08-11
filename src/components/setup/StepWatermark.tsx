import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function StepWatermark({ data, updateData }: { data: any, updateData: (data: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    updateData({ ...data, [e.target.name]: value });
  };

  const toggleEnabled = () => {
    updateData({ ...data, enabled: !data.enabled });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Watermark Settings</h2>
        <p className="text-gray-500 mb-6">Secure your documents with a custom watermark.</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button variant={data.enabled ? 'default' : 'outline'} onClick={toggleEnabled}>
          {data.enabled ? 'Watermark Enabled' : 'Watermark Disabled'}
        </Button>
      </div>

      {data.enabled && (
        <div className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="text">Watermark Text</Label>
            <Input 
              id="text" 
              name="text" 
              value={data.text || ''} 
              onChange={handleChange} 
              placeholder="CONFIDENTIAL" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity (%)</Label>
              <Input 
                id="opacity" 
                name="opacity" 
                type="number" 
                min="1" max="100" 
                value={data.opacity} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rotation">Rotation (degrees)</Label>
              <Input 
                id="rotation" 
                name="rotation" 
                type="number" 
                min="-90" max="90" 
                value={data.rotation} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="mt-8 relative h-40 border bg-gray-50 rounded overflow-hidden flex items-center justify-center">
             <div 
                className="absolute font-bold text-gray-500 text-4xl pointer-events-none select-none whitespace-nowrap"
                style={{
                  opacity: data.opacity / 100,
                  transform: `rotate(${data.rotation}deg)`
                }}
             >
                {data.text || 'WATERMARK'}
             </div>
             <p className="text-gray-300 z-10 opacity-50">Document Content Preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
