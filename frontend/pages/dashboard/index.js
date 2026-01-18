```javascript
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import Link from 'next/link';
import RoleGuard from '../../components/RoleGuard';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const u = Cookies.get('user');
    const token = Cookies.get('token');
    if (!u || !token) {
      router.push('/login'); return;
    }
    setUser(JSON.parse(u));
    fetchStudents(token, JSON.parse(u));
  }, []);

  async function fetchStudents(token, u) {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}`, 'x-school-id': u.schoolId || '' }
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user && <p className="mb-4">Welcome, {user.name} — role: {user.role}</p>}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Students</h3>
          <p className="text-4xl">{students.length}</p>
          <Link href="/dashboard/students"><a className="text-indigo-600">Manage</a></Link>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Teachers</h3>
          <p className="text-4xl">—</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-4xl">—</p>
        </div>
      </div>
    </div>
  );
}
```