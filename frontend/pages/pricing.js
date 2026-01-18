import axios from 'axios';
import { useState } from 'react';

export default function Pricing() {
  const plans = [
    { name: 'Free Trial', slug: 'free_trial', price: '$0' },
    { name: 'Basic', slug: 'basic', price: '$99/mo' },
    { name: 'Pro', slug: 'pro', price: '$299/mo' }
  ];

  const [loading, setLoading] = useState(false);

  async function checkout(plan) {
    setLoading(true);
    try {
      // in real integration, server should map slug to Stripe priceId
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-checkout-session`, {
        priceId: plan.priceId || 'price_test_dummy',
        schoolId: null,
        success_url: window.location.origin + '/dashboard',
        cancel_url: window.location.origin + '/pricing'
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Checkout failed: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="max-w-4xl w-full grid grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.slug} className="p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="text-2xl my-4">{p.price}</p>
            <ul className="mb-4 text-sm">
              <li>Students management</li>
              <li>Teachers & staff</li>
              <li>Attendance & results</li>
            </ul>
            <button onClick={() => checkout(p)} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
              {p.name === 'Free Trial' ? 'Start Free Trial' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}