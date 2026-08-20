import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams } from 'react-router-dom';

export default function SubscriptionPage() {
  const { session } = useAuth();
  const { error: toastError } = useToast();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [initiating, setInitiating] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },
    enabled: !!session,
  });

  const handleUpgrade = async (planId: string) => {
    setInitiating(planId);
    try {
      const res = await fetch('/api/subscription/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upgrade failed');
      window.location.href = result.authorizationUrl;
    } catch (err: any) {
      toastError(err.message);
      setInitiating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const { subscription, plans, recentPayments, currency } = data || {};
  const isTrial = !subscription || subscription.status === 'trial';
  
  const fmt = (n: any) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0 });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Subscription & Billing</h1>
        <p className="text-slate-500 mt-2">Manage your current plan and billing details.</p>
      </div>

      {statusParam === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">✓</div>
          <div>
            <p className="font-semibold">Payment Successful!</p>
            <p className="text-sm">Your subscription has been updated.</p>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Current Plan</h2>
            <p className="text-slate-500 text-sm mt-1">
              {isTrial ? 'You are currently on a free trial.' : `Your plan renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
            isTrial ? 'bg-yellow-100 text-yellow-700' :
            subscription?.status === 'active' ? 'bg-green-100 text-green-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {isTrial ? 'Trial' : subscription.status}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600 mb-1">{subscription?.planName || 'Free Trial'}</p>
              {subscription?.planDescription && <p className="text-sm text-slate-500">{subscription.planDescription}</p>}
            </div>
            {!isTrial && (
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {currency} {fmt(subscription[subscription.billingCycle + 'Price'])}
                  <span className="text-sm text-slate-500 font-normal"> / {subscription.billingCycle.replace('ly', '')}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upgrade Plan</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a plan that fits your business needs.</p>
          </div>
          <div className="bg-slate-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan: any) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isCurrent = subscription?.planId === plan.id && subscription?.billingCycle === billingCycle;
            
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col ${isCurrent ? 'border-emerald-600 shadow-md ring-1 ring-emerald-600' : 'border-slate-200 shadow-sm'}`}>
                {isCurrent && <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">CURRENT PLAN</span>}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1 h-10">{plan.description}</p>
                <div className="my-6">
                  <span className="text-3xl font-bold text-slate-900">{currency} {fmt(price)}</span>
                  <span className="text-slate-500"> / {billingCycle.replace('ly', '')}</span>
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span>
                    {plan.invoiceLimit ? `Up to ${plan.invoiceLimit} invoices` : 'Unlimited invoices'}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span>
                    {plan.customerLimit ? `Up to ${plan.customerLimit} customers` : 'Unlimited customers'}
                  </li>
                  {plan.features ? JSON.parse(plan.features).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  )) : null}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || initiating === plan.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                    initiating === plan.id ? 'bg-emerald-600 opacity-70 text-white cursor-wait' :
                    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  }`}
                >
                  {initiating === plan.id ? 'Redirecting...' : isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      {recentPayments?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Billing History</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Description</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentPayments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-900">{p.notes || 'Subscription Payment'}</td>
                  <td className="px-6 py-4 text-right font-medium">{p.currency} {fmt(p.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
