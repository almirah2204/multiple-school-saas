import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState('school_admin');
  const r = useRouter();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, { email, password, name, role, school_name: schoolName });
      Cookies.set('token', res.data.token);
      Cookies.set('user', JSON.stringify(res.data.user));
      r.push('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Sign up</h2>
        <input className="w-full p-2 border mb-3" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full p-2 border mb-3" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full p-2 border mb-3" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <input className="w-full p-2 border mb-3" placeholder="School name (for school admin)" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
        <select className="w-full p-2 border mb-3" value={role} onChange={e => setRole(e.target.value)}>
          <option value="school_admin">School Admin</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="student">Student</option>
        </select>
        <button className="w-full py-2 bg-indigo-600 text-white rounded">Sign up</button>
      </form>
    </div>
  );
}