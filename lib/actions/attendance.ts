"use server";
import {createClient} from '@/lib/supabase/server';
import {z} from 'zod';

export async function checkInEventAction(eventId:string,universityId:string){
 if(!z.string().uuid().safeParse(eventId).success||!z.string().uuid().safeParse(universityId).success)return {success:false,error:'Invalid event.'};
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {success:false,error:'Sign in to check in.'};
 const {error}=await db.from('event_attendance').insert({user_id:user.id,event_id:eventId,university_id:universityId,status:'checked_in'});
 if(error?.code==='23505')return {success:true,message:'You are already checked in.'};
 if(error)return {success:false,error:'Check-in is available to verified members from 30 minutes before the event until it ends.'};
 return {success:true,message:'Your check-in has been recorded.'};
}
