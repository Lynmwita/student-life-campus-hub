import {createClient} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
import {Suspense} from 'react';
import {AppHeader} from '@/components/shared/app-header';
export default function Results(){return <><AppHeader/><Suspense fallback={<p role="status" className="p-6">Loading your published results...</p>}><PublishedResults/></Suspense></>;}
async function PublishedResults(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');
 const {data,error}=await db.from('uams_academic_records').select('id,data').eq('kind','grade').eq('student_id',user.id).order('source_updated_at',{ascending:false});
 return <main className="mx-auto max-w-5xl space-y-6 p-6"><h1 className="text-3xl font-bold">Academic results</h1><p>Approved results published by the registrar.</p>{error?<p role="alert">Results are temporarily unavailable. Please retry later.</p>:!data?.length?<p>No approved results have been published for your account.</p>:<div className="overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">Published course results</caption><thead><tr>{['Course','Academic year','Semester','Score','Grade'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{data.map(r=><tr key={r.id} className="border-t"><td className="p-3">{r.data.course_code} — {r.data.course_name}</td><td className="p-3">{r.data.academic_year}</td><td className="p-3">{r.data.semester}</td><td className="p-3">{r.data.score??'—'}</td><td className="p-3 font-semibold">{r.data.grade}</td></tr>)}</tbody></table></div>}</main>;
}
