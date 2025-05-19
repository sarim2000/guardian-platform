import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema/service';

export async function GET(request: NextRequest) {
  const servicesData = await db.select().from(services);
  return NextResponse.json(servicesData);
} 
