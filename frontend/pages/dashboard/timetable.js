import { useEffect, useState } from 'react';
import { api, authHeaders, getUser } from '../../lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function TimetablePage() {
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [day, setDay] = useState('Monday');
  const [slot, setSlot] = useState('09:00-10:00');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canCreate = user && ['school_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    const u = getUser();
    const t = Cookies.get('token');
    if (!u || !t) { router.push('/login'); return; }
    setUser(u);
    fetchTimetable();
    fetchTeachers();
  }, []);

  async function fetchTimetable() {
    try {
      const res = await api.get('/timetable', { headers: authHeaders() });
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTeachers() {
    try {
      const res = await api.get('/teachers', { headers: authHeaders() });
      setTeachers(res.data);
      if (res.data.length) setTeacherId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) return alert('You do not have permission to modify the timetable.');
    if (!subject) return alert('Subject required');
    setLoading(true);
    try {
      await api.post('/timetable', { day, slot, subject, teacher_id: teacherId }, { headers: authHeaders() });
      setSubject('');
      fetchTimetable();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Timetable</h2>

      {canCreate ? (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={day} onChange={e=>setDay(e.target.value)} className="p-2 border">
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=> <option key={d} value={d}>{d}</option>)}
          </select>

          <input value={slot} onChange={e=>setSlot(e.target.value)} className="p-2 border" placeholder="Slot e.g. 09:00-10:00" />

          <input value={subject} onChange={e=>setSubject(e.target.value)} className="p-2 border" placeholder="Subject" />

          <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="p-2 border">
            <option value="">Select teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.subject ? `(${t.subject})` : ''}</option>)}
          </select>

          <div className="md:col-span-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Add to Timetable'}</button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          You can view the timetable here. Only school admins can modify it.
        </div>
      )}

      <div className="grid gap-3">
        {timetable.length === 0 && <p className="text-sm text-slate-500">No timetable entries yet.</p>}
        {timetable.map(t => (
          <div key={t.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-sm text-slate-600">{t.day} • {t.slot}</div>
            </div>
            <div className="text-sm text-slate-500">Teacher ID: {t.teacher_id || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}