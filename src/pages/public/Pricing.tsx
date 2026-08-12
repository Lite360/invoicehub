import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for freelancers just starting out.',
      features: ['Up to 5 invoices per month', 'Basic templates', 'Standard support'],
    },
    {
      name: 'Professional',
      price: '₦2,500 / month',
      description: 'For growing businesses and agencies.',
      features: ['Unlimited invoices', 'Premium templates', 'Custom branding', 'Priority support'],
    },
    {
      name: 'Business',
      price: '₦10,000 / month',
      description: 'Advanced features for established companies.',
      features: ['Everything in Pro', 'Multiple team members', 'API access', 'Dedicated account manager'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <Link to="/" className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-blue-600">📄</span> InvoiceHub
        </Link>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium">Log in</Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-16">
          No hidden fees. No surprise charges. Just pick the plan that fits your business.
        </p>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-slate-500 mb-6">{plan.description}</p>
              <div className="text-3xl font-bold text-slate-900 mb-8">{plan.price}</div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/register">
                <Button className="w-full h-12 text-lg">Choose {plan.name}</Button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
