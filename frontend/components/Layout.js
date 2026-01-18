import Link from 'next/link';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();
  useEffect(() => {
    const u = Cookies.get('user');
    setUser(u ? JSON.parse(u) : null);
  }, []);

  function logout() {
    Cookies.remove('token'); Cookies.remove('user');
    router.push('/login');
  }

  return (
    <div>
      <nav className="bg-indigo-700 text-white p-4 flex justify-between">
        <div className="flex items-center gap-4">
          <Link href="/"><a className="font-bold">SchoolSaaS</a></Link>
          <Link href="/pricing"><a>Pricing</a></Link>
        </div>
        <div>
          {user ? (
            <>
              <span className="mr-4">Hi, {user.name}</span>
              <button onClick={logout} className="bg-indigo-900 px-3 py-1 rounded">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login"><a className="mr-2">Login</a></Link>
              <Link href="/signup"><a>Signup</a></Link>
            </>
          )}
        </div>
      </nav>
      <main className="min-h-screen bg-slate-50">{children}</main>
    </div>
  );
}