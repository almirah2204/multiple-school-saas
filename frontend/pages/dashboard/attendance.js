import { useEffect, useState } from 'react';
import { api, fetchCurrentUser } from '../../lib/api';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('present');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canCreate = user && ['teacher', 'school_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    (async () => {
      const u = await fetchCurrentUser();
      if (!u) { router.push('/login'); return; }
      setUser(u);
      await fetchStudents(u);
      await fetchAttendance(u);
    })();
  }, []);

  async function fetchStudents(u) {
    try {
      const res = await api.get('/students', { headers: { 'x-school-id': u.schoolId || '' } });
      setStudents(res.data);
      if (res.data.length) setStudentId(res.data[0].id);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  }

  async function fetchAttendance(u) {
    try {
      const res = await api.get('/attendance', { headers: { 'x-school-id': u.schoolId || '' } });
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
      setAttendance([]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) return alert('You do not have permission to record attendance.');
    if (!studentId) return alert('Select student');
    setLoading(true);
    try {
      await api.post('/attendance', { student_id: studentId, status, date }, { headers: { 'x-school-id': user.schoolId || '' } });
      setStatus('present');
      fetchAttendance(user);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`, { headers: { 'x-school-id': user.schoolId || '' } });
      fetchAttendance(user);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Attendance</h2>

      {canCreate ? (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="p-2 border">
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name || '—'})</option>)}
            </select>

            <select value={status} onChange={e=>setStatus(e.target.value)} className="p-2 border">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>

            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="p-2 border" />

            <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
              {loading ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          You can view attendance records here. Only teachers and school admins can record attendance.
        </div>
      )}

      <div className="grid gap-3">
        {attendance.length === 0 && <p className="text-sm text-slate-500">No attendance records yet.</p>}
        {attendance.map(a => (
          <div key={a.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">Student ID: {a.student_id}</div>
              <div className="text-sm text-slate-600">Status: <span className="font-medium">{a.status}</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">{dayjs(a.date).format('YYYY-MM-DD')}</div>
              {canCreate && <button className="text-red-600" onClick={() => handleDelete(a.id)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}