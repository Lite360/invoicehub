import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🧾',
    title: 'Professional Invoices',
    desc: 'Create branded invoices with your logo, colors, and digital signature in seconds.',
  },
  {
    icon: '📋',
    title: 'Quotations & Estimates',
    desc: 'Send professional quotes and convert accepted ones to invoices with one click.',
  },
  {
    icon: '💳',
    title: 'Collect Payments',
    desc: 'Accept payments via Paystack directly from your invoice. Receipts are generated automatically.',
  },
  {
    icon: '🎨',
    title: 'Custom Branding',
    desc: 'Apply your logo, brand colors, watermark, and digital signature to every document.',
  },
  {
    icon: '📧',
    title: 'Automated Emails',
    desc: 'Invoices, receipts, and payment reminders are sent automatically to your customers.',
  },
  {
    icon: '📱',
    title: 'Works Everywhere',
    desc: 'Installable as an app on Android and iOS. Manage your business from any device.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Adaeze Okonkwo',
    role: 'Freelance Designer, Lagos',
    avatar: 'A',
    color: 'bg-pink-500',
    quote: 'InvoiceHub completely transformed how I bill clients. I went from sending Word docs to professional branded PDFs in minutes.',
  },
  {
    name: 'Emeka Nwosu',
    role: 'Digital Agency Owner, Abuja',
    avatar: 'E',
    color: 'bg-emerald-500',
    quote: 'The Paystack integration is seamless. Clients pay directly from the invoice and I get notified instantly. Game changer.',
  },
  {
    name: 'Funmi Adeleke',
    role: 'Consultant, Port Harcourt',
    avatar: 'F',
    color: 'bg-emerald-500',
    quote: 'Finally a Nigerian invoicing tool that actually works properly. The automatic receipt generation alone saves me hours every week.',
  },
];

const STATS = [
  { label: 'Businesses', value: '2,400+' },
  { label: 'Invoices Created', value: '180K+' },
  { label: 'Payments Collected', value: '₦2.1B+' },
  { label: 'Time Saved', value: '10K+ hrs' },
];

import { usePlatform } from '@/contexts/PlatformContext';

export default function LandingPage() {
  const { settings } = usePlatform();
  
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              IH
            </div>
            <span className="text-lg font-bold text-gray-900">{settings.siteName}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <a href="#testimonials" className="hover:text-gray-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500 rounded-full opacity-5 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-500 rounded-full opacity-5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600 rounded-full opacity-[0.03] blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Trusted by 2,400+ Nigerian businesses
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Create. Send.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Get Paid.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            InvoiceHub is the professional billing platform for Nigerian businesses. Create branded invoices, collect Paystack payments, and automate your receipts — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Start Free Today
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-lg font-semibold px-8 py-4 rounded-xl border border-white/10 transition-all hover:-translate-y-0.5"
            >
              View Pricing
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mock invoice card */}
        <div className="relative max-w-4xl mx-auto px-6 pb-0">
          <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-gray-200/20">
            <div className="bg-gray-50 border-b border-gray-100 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  IH
                </div>
                <div>
                  <p className="font-bold text-gray-900">Acme Design Studio</p>
                  <p className="text-xs text-gray-400">Invoice #INV-00042</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">PAID</span>
            </div>
            <div className="px-8 py-6 grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Bill To</p>
                <p className="font-semibold text-gray-900">TechCorp Nigeria Ltd.</p>
                <p className="text-gray-500">Lagos, Nigeria</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Issue Date</p>
                <p className="font-semibold text-gray-900">Aug 15, 2026</p>
                <p className="text-gray-400 text-xs mt-2">Due Date</p>
                <p className="font-semibold text-gray-900">Aug 30, 2026</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₦850,000</p>
                <span className="text-xs text-green-600">✓ Fully Paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Built for Nigerian Businesses
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              From freelancers to agencies — InvoiceHub has every tool you need to look professional and get paid faster.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-6 group-hover:bg-emerald-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm mb-3">Simple workflow</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">How InvoiceHub Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
            {[
              { step: '1', icon: '✍️', title: 'Register', desc: 'Create your account and set up your business profile in minutes.' },
              { step: '2', icon: '🎨', title: 'Brand It', desc: 'Add your logo, colors, and signature for a fully professional look.' },
              { step: '3', icon: '🧾', title: 'Create & Send', desc: 'Create an invoice or quotation and send it to your customer via email.' },
              { step: '4', icon: '💰', title: 'Get Paid', desc: 'Customer pays via Paystack. Receipt is auto-generated and emailed.' },
            ].map(step => (
              <div key={step.step} className="text-center relative">
                <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-emerald-500/20 relative z-10">
                  {step.icon}
                </div>
                <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-emerald-600 text-emerald-600 text-xs font-bold flex items-center justify-center" style={{ top: '-4px', right: 'calc(50% - 48px)' }}>
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm mb-3">Real results</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Loved by businesses across Nigeria</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-colors">
                <div className="flex text-yellow-400 text-sm mb-6">★★★★★</div>
                <p className="text-slate-300 leading-relaxed mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Get Paid Faster?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join thousands of Nigerian businesses that use InvoiceHub to look professional and collect payments with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-emerald-700 text-lg font-bold px-8 py-4 rounded-xl transition-all hover:bg-emerald-50 shadow-xl"
            >
              Start Free Today →
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-white text-lg font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all"
            >
              See Pricing
            </Link>
          </div>
          <p className="text-sm text-emerald-200 mt-6">No credit card required · Free to start · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">IH</div>
            <span className="font-bold text-white text-sm">{settings.siteName}</span>
            <span className="text-xs">— Create. Send. Get Paid.</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
