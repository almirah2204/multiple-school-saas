import { useEffect, useState } from 'react';
import { api, authHeaders, getUser } from '../../lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

export default function FeesPage() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canCreate = user && ['school_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    const u = getUser();
    const t = Cookies.get('token');
    if (!u || !t) { router.push('/login'); return; }
    setUser(u);
    fetchStudents();
    fetchFees();
  }, []);

  async function fetchStudents() {
    try {
      const res = await api.get('/students', { headers: authHeaders() });
      setStudents(res.data);
      if (res.data.length) setStudentId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchFees() {
    try {
      const res = await api.get('/fees', { headers: authHeaders() });
      setFees(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) return alert('You do not have permission to create fees.');
    if (!studentId || !amount) return alert('Student and amount required');
    setLoading(true);
    try {
      await api.post('/fees', { student_id: studentId, amount: parseFloat(amount), due_date: dueDate }, { headers: authHeaders() });
      setAmount(''); setDueDate('');
      fetchFees();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Fees</h2>

      {canCreate ? (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="p-2 border">
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <input placeholder="Amount (e.g. 150.00)" value={amount} onChange={e=>setAmount(e.target.value)} className="p-2 border" />

          <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="p-2 border" />

          <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Create Fee'}</button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          You can view fees here. Only school admins can create fees.
        </div>
      )}

      <div className="space-y-3">
        {fees.length === 0 && <p className="text-sm text-slate-500">No fees recorded yet.</p>}
        {fees.map(f => (
          <div key={f.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">Student ID: {f.student_id}</div>
              <div className="text-sm text-slate-600">Amount: ${parseFloat(f.amount).toFixed(2)} • Status: {f.status || 'unpaid'}</div>
            </div>
            <div className="text-sm text-slate-500">{f.due_date ? dayjs(f.due_date).format('YYYY-MM-DD') : 'No due date'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}