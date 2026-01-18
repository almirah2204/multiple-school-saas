import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="max-w-3xl p-8 bg-white rounded shadow">
        <h1 className="text-3xl font-bold mb-4">School Management SaaS</h1>
        <p className="mb-6">Multi-school management for students, teachers, attendance, fees, timetables and more.</p>
        <div className="flex gap-4">
          <Link href="/pricing"><a className="px-4 py-2 bg-indigo-600 text-white rounded">Pricing</a></Link>
          <Link href="/signup"><a className="px-4 py-2 border rounded">Get Started</a></Link>
        </div>
      </div>
    </div>
  );
}