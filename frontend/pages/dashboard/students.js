import axios from 'axios';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = Cookies.get('user');
    const t = Cookies.get('token');
    if (!user || !t) { router.push('/login'); return; }
    fetchStudents(t, JSON.parse(user));
  }, []);

  async function fetchStudents(token, user) {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`, { headers: { Authorization: `Bearer ${Cookies.get('token')}`, 'x-school-id': user.schoolId || '' }});
      setStudents(res.data);
    } catch (err) { console.error(err); }
  }

  async function createStudent(e) {
    e.preventDefault();
    try {
      const user = JSON.parse(Cookies.get('user'));
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/students`, { name, school_id: user.schoolId }, { headers: { Authorization: `Bearer ${Cookies.get('token')}`, 'x-school-id': user.schoolId || '' }});
      setName('');
      fetchStudents(Cookies.get('token'), user);
    } catch (err) { alert(err.response?.data?.error || err.message); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Students</h2>
      <form onSubmit={createStudent} className="mb-4">
        <input value={name} onChange={e=>setName(e.target.value)} className="border p-2 mr-2" placeholder="Student name" />
        <button className="px-3 py-2 bg-indigo-600 text-white rounded">Add</button>
      </form>
      <ul>
        {students.map(s => <li key={s.id} className="p-2 bg-white mb-2 rounded shadow">{s.name} — class: {s.class_name}</li>)}
      </ul>
    </div>
  );
}