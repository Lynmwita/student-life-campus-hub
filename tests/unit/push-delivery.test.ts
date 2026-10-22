import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const {sendNotification,setVapidDetails,from}=vi.hoisted(()=>({sendNotification:vi.fn(),setVapidDetails:vi.fn(),from:vi.fn()}));
vi.mock('web-push',()=>({default:{sendNotification,setVapidDetails}}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from})}));
import {deliverAnnouncementPush,pushUrgency} from '@/lib/push/delivery';
const notice={id:'notice',university_id:'tenant',title:'Private exam result',content:'Sensitive details',is_published:true,priority:'P1',target_scope:'department',target_department:'Computing'};
const sub={id:'sub',endpoint:'https://fcm.googleapis.com/push/test',p256dh:'key',auth:'auth'};
function builder(data:unknown,error:unknown=null){const b:Record<string,unknown>={};for(const k of ['select','eq','in','contains','insert','update','delete','match'])b[k]=vi.fn(()=>b);b.single=vi.fn(async()=>({data,error}));b.then=(resolve:(v:unknown)=>unknown)=>Promise.resolve({data,error}).then(resolve);return b;}
beforeEach(()=>{vi.stubEnv('VAPID_PRIVATE_KEY','private');vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY','public');vi.stubEnv('VAPID_SUBJECT','mailto:admin@example.com');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service');sendNotification.mockReset().mockResolvedValue({});from.mockReset();});
afterEach(()=>vi.unstubAllEnvs());
it('maps all four priorities to transport urgency',()=>{expect(['P1','P2','P3','P4'].map(pushUrgency)).toEqual(['high','normal','low','very-low']);});
it('sends only eligible tenant recipients and omits private announcement content from lock screens',async()=>{
 const subs=builder([sub]);from.mockImplementation((table:string)=>table==='announcements'?builder(notice):table==='university_memberships'?builder([{user_id:'eligible',department:'Computing'},{user_id:'excluded',department:'Business'}]):table==='push_subscriptions'?subs:builder(null));
 expect(await deliverAnnouncementPush('notice')).toMatchObject({sent:1,failed:0});expect(subs.in).toHaveBeenCalledWith('user_id',['eligible']);expect(subs.contains).toHaveBeenCalledWith('priorities',['P1']);const payload=JSON.parse(sendNotification.mock.calls[0][1]);expect(JSON.stringify(payload)).not.toContain('Sensitive');expect(JSON.stringify(payload)).not.toContain('exam result');expect(sendNotification.mock.calls[0][2].urgency).toBe('high');
});
it('does not resend a claimed delivery and does not contact a push service before configuration',async()=>{
 from.mockImplementation((table:string)=>table==='announcements'?builder(notice):table==='university_memberships'?builder([{user_id:'eligible',department:'Computing'}]):table==='push_subscriptions'?builder([sub]):builder(null,{code:'23505'}));
 expect((await deliverAnnouncementPush('notice')).sent).toBe(0);expect(sendNotification).not.toHaveBeenCalled();vi.stubEnv('VAPID_PRIVATE_KEY','');expect((await deliverAnnouncementPush('notice')).configured).toBe(false);
});
it('removes expired subscriptions and leaves transient failures retryable',async()=>{
 const subscriptions=builder([sub]),deliveries=builder(null);from.mockImplementation((table:string)=>table==='announcements'?builder(notice):table==='university_memberships'?builder([{user_id:'eligible',department:'Computing'}]):table==='push_subscriptions'?subscriptions:deliveries);
 sendNotification.mockRejectedValue({statusCode:410});expect((await deliverAnnouncementPush('notice')).failed).toBe(1);expect(subscriptions.delete).toHaveBeenCalled();sendNotification.mockRejectedValue({statusCode:503});await deliverAnnouncementPush('notice');expect(deliveries.delete).toHaveBeenCalled();
});
