"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({rating:z.coerce.number().int().min(1).max(5),category:z.enum(['usability','performance','accessibility','content','other']),message:z.string().trim().min(10).max(4000)});
export async function submitPilotFeedbackAction(form: FormData) {
 const parsed=feedbackSchema.safeParse(Object.fromEntries(form));
 if(!parsed.success) return {success:false,message:parsed.error.issues[0].message};
 const db=await createClient(); const {data:{user}}=await db.auth.getUser();
 if(!user) return {success:false,message:'Sign in with a verified student account to send feedback.'};
 const {data:membership}=await db.from('university_memberships').select('university_id').eq('user_id',user.id).eq('verification_status','verified').limit(1).maybeSingle();
 if(!membership) return {success:false,message:'A verified university membership is required.'};
 const {error}=await db.from('pilot_feedback').insert({...parsed.data,user_id:user.id,university_id:membership.university_id});
 return {success:!error,message:error?'Feedback could not be saved. Please try again.':'Thank you. Your feedback has been sent to your university team.'};
}
export async function getPilotFeedbackAction() {
 const db=await createClient(); const {data:{user}}=await db.auth.getUser();
 if(!user) return {success:false,feedback:[],message:'Sign in to view feedback.'};
 const {data,error}=await db.from('pilot_feedback').select('id,user_id,university_id,rating,category,message,status,staff_note,created_at,updated_at,reviewed_at').order('created_at',{ascending:false}).limit(200);
 return {success:!error,feedback:data??[],message:error?'Feedback could not be loaded.':undefined};
}
export async function reviewPilotFeedbackAction(id:string,status:string,staffNote:string) {
 if(!z.string().uuid().safeParse(id).success || !['reviewed','planned','resolved'].includes(status) || staffNote.length>4000) return {success:false,message:'Invalid review.'};
 const db=await createClient(); const {data:{user}}=await db.auth.getUser();
 if(!user) return {success:false,message:'Sign in to review feedback.'};
 const {data,error}=await db.from('pilot_feedback').update({status,staff_note:staffNote.trim(),reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('id',id).select('id').maybeSingle();
 return {success:!error&&!!data,message:error||!data?'Feedback could not be reviewed.':'Review saved.'};
}
