import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processNotificationQueue } from "@/lib/notifications/service";
import { processPushNotifications } from "@/lib/notifications/push";
export const dynamic="force-dynamic";
export async function GET(request:Request){const secret=process.env.CRON_SECRET;if(!secret)return NextResponse.json({error:"cron_not_configured"},{status:503});if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"unauthorized"},{status:401});const db=createAdminClient()as any;const{data:reminders}=await db.rpc("enqueue_pickup_reminders");const processed=await processNotificationQueue(25),push=await processPushNotifications(50);return NextResponse.json({ok:true,reminders,processed:processed.length,succeeded:processed.filter(item=>item.ok).length,push})}
