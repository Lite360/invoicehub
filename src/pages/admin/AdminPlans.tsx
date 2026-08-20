import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface Plan {
  id: string;
  name: string;
  description?: string;
  weeklyPrice: string;
  monthlyPrice: string;
  yearlyPrice: string;
  invoiceLimit?: number;
  customerLimit?: number;
  teamMemberLimit: number;
  features?: string;
  status: string;
}

const EMPTY_PLAN: Omit<Plan, 'id'> = {
  name: '',
  description: '',
  weeklyPrice: '0',
  monthlyPrice: '0',
  yearlyPrice: '0',
  invoiceLimit: undefined,
  customerLimit: undefined,
  teamMemberLimit: 1,
  features: '[]',
  status: 'active',
};

export default function AdminPlans() {
  const { session } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<any>(EMPTY_PLAN);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<Plan[]>;
    },
    enabled: !!session,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editPlan ? `/api/admin/plans?id=${editPlan.id}` : '/api/admin/plans';
      const method = editPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save plan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      success(editPlan ? 'Plan updated' : 'Plan created');
      setShowForm(false);
      setEditPlan(null);
      setForm(EMPTY_PLAN);
    },
    onError: () => toastError('Failed to save plan'),
  });

  const handleEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({ ...plan });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const fmt = (n: string) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-500 text-sm mt-1">Manage pricing plans for InvoiceHub</p>
        </div>
        <button
          onClick={() => { setEditPlan(null); setForm(EMPTY_PLAN); setShowForm(true); }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + New Plan
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-100 animate-pulse rounded-xl h-48" />
        )) : plans.map(plan => (
          <div key={plan.id} className={`bg-white rounded-xl border shadow-sm p-6 ${plan.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{plan.description}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {plan.status}
              </span>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-500">Weekly</span><span className="font-semibold">₦{fmt(plan.weeklyPrice)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-semibold">₦{fmt(plan.monthlyPrice)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Yearly</span><span className="font-semibold">₦{fmt(plan.yearlyPrice)}</span></div>
            </div>
            <div className="text-xs text-slate-400 mb-4 space-y-0.5">
              <div>Invoice limit: {plan.invoiceLimit ?? 'Unlimited'}</div>
              <div>Customer limit: {plan.customerLimit ?? 'Unlimited'}</div>
              <div>Team members: {plan.teamMemberLimit}</div>
            </div>
            <button
              onClick={() => handleEdit(plan)}
              className="w-full py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ✏️ Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editPlan ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">Plan Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                {[
                  { key: 'weeklyPrice', label: 'Weekly Price (₦)' },
                  { key: 'monthlyPrice', label: 'Monthly Price (₦)' },
                  { key: 'yearlyPrice', label: 'Yearly Price (₦)' },
                  { key: 'invoiceLimit', label: 'Invoice Limit (blank = unlimited)' },
                  { key: 'customerLimit', label: 'Customer Limit (blank = unlimited)' },
                  { key: 'teamMemberLimit', label: 'Team Member Limit' },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">{f.label}</label>
                    <input type="number" min="0" value={form[f.key] ?? ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-60">
                  {saveMutation.isPending ? 'Saving...' : editPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
