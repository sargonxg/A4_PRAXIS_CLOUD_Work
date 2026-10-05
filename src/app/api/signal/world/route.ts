import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getSignalWorld } from '@/lib/signal/world-service';
export const runtime='nodejs';
export const GET=withAuth(async()=>{
 try{return NextResponse.json({world:await getSignalWorld()},{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 catch{return NextResponse.json({error:'Public source observations are temporarily unavailable. Try again later.'},{status:503,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
});
