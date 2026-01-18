import { useEffect, useState } from 'react';
import { api, authHeaders, getUser } from '../../lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function ResultsPage() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canCreate = user && ['teacher', 'school_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    const u = getUser();
    const t = Cookies.get('token');
    if (!u || !t) { router.push('/login'); return; }
    setUser(u);
    fetchStudents();
    fetchResults();
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

  async function fetchResults() {
    try {
      const res = await api.get('/results', { headers: authHeaders() });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) return alert('You do not have permission to add results.');
    if (!studentId || !subject || !marks) return alert('Student, subject and marks required');
    setLoading(true);
    try {
      await api.post('/results', { student_id: studentId, subject, marks: parseFloat(marks), term }, { headers: authHeaders() });
      setSubject(''); setMarks('');
      fetchResults();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Results</h2>

      {canCreate ? (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="p-2 border">
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <input value={subject} onChange={e=>setSubject(e.target.value)} className="p-2 border" placeholder="Subject" />

          <input value={marks} onChange={e=>setMarks(e.target.value)} className="p-2 border" placeholder="Marks" />

          <select value={term} onChange={e=>setTerm(e.target.value)} className="p-2 border">
            <option>Term 1</option>
            <option>Term 2</option>
            <option>Term 3</option>
          </select>

          <div className="md:col-span-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Add Result'}</button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          You can view results here. Only teachers and school admins can add results.
        </div>
      )}

      <div className="space-y-3">
        {results.length === 0 && <p className="text-sm text-slate-500">No results recorded yet.</p>}
        {results.map(r => (
          <div key={r.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">Student ID: {r.student_id} — {r.subject}</div>
              <div className="text-sm text-slate-600">Marks: {r.marks} • {r.term}</div>
            </div>
            <div className="text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}