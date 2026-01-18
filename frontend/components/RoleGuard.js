import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoleGuard({ roles, children }) {
  const router = useRouter();
  useEffect(() => {
    const u = Cookies.get('user');
    if (!u) router.push('/login');
    const user = JSON.parse(u || '{}');
    if (!roles.includes(user.role)) router.push('/dashboard');
  }, []);
  return children;
}