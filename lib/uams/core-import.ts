import type { SupabaseClient } from '@supabase/supabase-js';
import type { UamsSyncPayload } from '@/lib/validations/sync';

async function checked<T extends {error:unknown}>(query:PromiseLike<T>):Promise<T>{const result=await query;if(result.error)throw new Error('UAMS database operation was not acknowledged. Retry safely.');return result;}

/** Production imports never count a local cache as a durable acknowledgement. */
export async function importCore(client:SupabaseClient,universityId:string,payload:UamsSyncPayload){
 const counts={students_inserted:0,students_updated:0,course_units_inserted:0,course_units_updated:0,timetables_inserted:0,timetables_updated:0};
 const {data:campuses}=await checked(client.from('campuses').select('id,code').eq('university_id',universityId));
 const campus=(code:string|undefined)=>{const found=campuses?.find(c=>c.code.toUpperCase()===code?.toUpperCase());if(!found)throw new Error(`Unknown campus code ${code}.`);return found.id;};
 const authUsers=new Map<string,string>();let authDirectoryLoaded=false;
 for(const unit of payload.course_units){
  const {data:existing}=await checked(client.from('course_units').select('*').eq('university_id',universityId).eq('code',unit.code).maybeSingle());
  if(existing&&Object.entries(unit).every(([k,v])=>existing[k]===v))continue;
  await checked(client.from('course_units').upsert({...unit,university_id:universityId},{onConflict:'university_id,code'}));
  counts[existing?'course_units_updated':'course_units_inserted']++;
 }
 for(const student of payload.students){
  const email=student.email.toLowerCase();
  const {data:profile}=await checked(client.from('user_profiles').select('id').eq('email',email).maybeSingle());
  let userId=profile?.id;
  let existingAuth=Boolean(userId);
  if(!userId){
   // Auth users can predate profiles. Resolve every page before provisioning.
   for(let page=1;!authDirectoryLoaded;page++){
    const result=await client.auth.admin.listUsers({page,perPage:100});if(result.error)throw result.error;
    for(const user of result.data.users)if(user.email)authUsers.set(user.email.toLowerCase(),user.id);
    if(result.data.users.length<100){authDirectoryLoaded=true;break;}
   }
   userId=authUsers.get(email);existingAuth=Boolean(userId);
   if(!userId){const result=await client.auth.admin.createUser({email,password:student.initial_password||crypto.randomUUID(),email_confirm:true,user_metadata:{full_name:student.full_name,must_reset_password:true}});if(result.error||!result.data.user)throw new Error('Student auth provisioning failed.');userId=result.data.user.id;authUsers.set(email,userId);}
  }
  if(student.initial_password && existingAuth){
   const result=await client.auth.admin.updateUserById(userId,{password:student.initial_password});
   if(result.error)throw new Error('Explicit student password update was not acknowledged.');
  }
  await checked(client.from('user_profiles').upsert({id:userId,email,full_name:student.full_name},{onConflict:'id'}));
  const {data:existing}=await checked(client.from('university_memberships').select('*').eq('user_id',userId).eq('university_id',universityId).maybeSingle());
  if(existing&&existing.role!=='student')throw new Error('Registrar import cannot overwrite staff membership.');
  const membership={user_id:userId,university_id:universityId,campus_id:campus(student.campus_code),role:'student',registration_number:student.registration_number,faculty:student.faculty,department:student.department,program_of_study:student.program_of_study||student.program_name||`Bachelor of Science in ${student.department}`,year_of_study:student.year_of_study};
  const changed=!existing||Object.entries(membership).some(([k,v])=>existing[k]!==v);
  if(changed){await checked(client.from('university_memberships').upsert(membership,{onConflict:'user_id,university_id'}));counts[existing?'students_updated':'students_inserted']++;}
  if(student.enrollment_status){await checked(client.rpc('sync_uams_enrollment',{p_university_id:universityId,p_user_id:userId,p_status:student.enrollment_status,p_updated_at:student.enrollment_updated_at}));}
 }
 for(const schedule of payload.timetables){
  const {data:unit}=await checked(client.from('course_units').select('id').eq('university_id',universityId).eq('code',schedule.course_code).single());if(!unit)throw new Error('Timetable references unknown course.');
  const row={university_id:universityId,campus_id:campus(schedule.campus_code),course_unit_id:unit.id,day_of_week:schedule.day_of_week,start_time:schedule.start_time,end_time:schedule.end_time,venue:schedule.venue,lecturer_name:schedule.lecturer_name,semester:schedule.semester,academic_year:schedule.academic_year,is_active:schedule.is_active,...(schedule.source_id?{source_id:schedule.source_id,source_updated_at:schedule.updated_at}: {})};
  if(schedule.source_id){
   if(!schedule.updated_at)throw new Error('Source timetable updates require an authoritative timestamp.');
   const {data:source}=await checked(client.from('timetables').select('*').eq('university_id',universityId).eq('source_id',schedule.source_id).maybeSingle());
   if(source){if(Date.parse(source.source_updated_at)>=Date.parse(schedule.updated_at))continue;await checked(client.from('timetables').upsert({...row,id:source.id},{onConflict:'university_id,source_id'}));counts.timetables_updated++;continue;}
  }
  let query=client.from('timetables').select('*');for(const key of ['university_id','campus_id','course_unit_id','day_of_week','start_time','semester','academic_year'] as const)query=query.eq(key,row[key]);
  const {data:existing}=await checked(query.maybeSingle());if(existing&&existing.venue===row.venue&&existing.lecturer_name===row.lecturer_name&&existing.end_time.slice(0,5)===row.end_time.slice(0,5)&&existing.is_active===row.is_active&&!schedule.source_id)continue;
  if(schedule.source_id&&existing?.source_id&&existing.source_id!==schedule.source_id)throw new Error('Timetable source conflicts with an occupied slot.');
  await checked(client.from('timetables').upsert(row,{onConflict:'university_id,course_unit_id,campus_id,day_of_week,start_time,academic_year,semester'}));counts[existing?'timetables_updated':'timetables_inserted']++;
 }
 return counts;
}

export async function importAcademicRecords(client:SupabaseClient,universityId:string,payload:UamsSyncPayload){
 const records=[...payload.grades.map(data=>({...data,kind:'grade'})),...payload.events.map(data=>({...data,kind:'event'})),...payload.academic_dates.map(data=>({...data,date_kind:data.kind,kind:'date'}))];
 if(!records.length)return {processed:0,inserted:0,updated:0,unchanged:0};
 const total={processed:0,inserted:0,updated:0,unchanged:0};
 for(let offset=0;offset<records.length;offset+=1000){
  const batch=records.slice(offset,offset+1000);
  const {data}=await checked(client.rpc('sync_uams_academic_records',{p_university_id:universityId,p_records:batch}));
  if(!data||data.processed!==batch.length||['processed','inserted','updated','unchanged'].some(k=>!Number.isSafeInteger(data[k])||data[k]<0)||data.inserted+data.updated+data.unchanged!==batch.length)throw new Error('Invalid academic import acknowledgement.');
  for(const key of ['processed','inserted','updated','unchanged'] as const)total[key]+=data[key];
 }
 return total;
}
