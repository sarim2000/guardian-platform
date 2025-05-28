import { db } from "@/db";
import { services } from "@/db/schema/service";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ catalog: string }> }) {
  const { catalog } = await params;
  const servicesData = await db.select().from(services).where(eq(services.partOf, catalog));

  return NextResponse.json(servicesData);
} 
