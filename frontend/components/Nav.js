import Link from 'next/link';

export default function Nav() {
  return (
    <div className="p-4">
      <Link href="/dashboard"><a className="block mb-2">Dashboard</a></Link>
      <Link href="/dashboard/students"><a className="block mb-2">Students</a></Link>
      <Link href="/dashboard/teachers"><a className="block mb-2">Teachers</a></Link>
      <Link href="/dashboard/attendance"><a className="block mb-2">Attendance</a></Link>
      <Link href="/dashboard/fees"><a className="block mb-2">Fees</a></Link>
      <Link href="/dashboard/timetable"><a className="block mb-2">Timetable</a></Link>
      <Link href="/dashboard/results"><a className="block mb-2">Results</a></Link>
      <Link href="/dashboard/noticeboard"><a className="block mb-2">Noticeboard</a></Link>
    </div>
  );
}