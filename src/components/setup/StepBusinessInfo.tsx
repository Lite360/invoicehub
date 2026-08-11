import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StepBusinessInfo({ data, updateData }: { data: any, updateData: (data: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-2">Business Information</h2>
        <p className="text-gray-500 mb-6">Let's start with the basic details of your company.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name *</Label>
          <Input id="name" name="name" value={data.name || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Business Type</Label>
          <Input id="type" name="type" placeholder="e.g. LLC, Sole Proprietorship" value={data.type || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Business Email</Label>
          <Input id="email" name="email" type="email" value={data.email || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" value={data.phone || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" value={data.address || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" placeholder="https://" value={data.website || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input id="registrationNumber" name="registrationNumber" value={data.registrationNumber || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID (TIN / VAT)</Label>
          <Input id="taxId" name="taxId" value={data.taxId || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" placeholder="NGN, USD, EUR" value={data.currency || 'NGN'} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}
