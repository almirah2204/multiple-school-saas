import { useEffect, useState } from 'react';
import { api, authHeaders, getUser } from '../../lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function NoticeboardPage() {
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canCreate = user && ['teacher', 'school_admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    const u = getUser();
    const t = Cookies.get('token');
    if (!u || !t) { router.push('/login'); return; }
    setUser(u);
    fetchNotices();
  }, []);

  async function fetchNotices() {
    try {
      const res = await api.get('/noticeboard', { headers: authHeaders() });
      setNotices(res.data);
    } catch (err) {
      console.error(err);
      setNotices([]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!canCreate) return alert('You do not have permission to post notices.');
    if (!title || !body) return alert('Title and body required');
    setLoading(true);
    try {
      await api.post('/noticeboard', { title, body }, { headers: authHeaders() });
      setTitle(''); setBody('');
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Noticeboard</h2>

      {canCreate ? (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="p-2 border" />
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Body" rows="4" className="p-2 border" />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? 'Posting...' : 'Post Notice'}</button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          You can view notices here. Only teachers and school admins can post notices.
        </div>
      )}

      <div className="space-y-3">
        {notices.length === 0 && <p className="text-sm text-slate-500">No notices yet.</p>}
        {notices.map(n => (
          <div key={n.id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{n.title}</h3>
              <div className="text-sm text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <p className="text-sm text-slate-700 mt-2">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}