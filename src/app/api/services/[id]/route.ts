import { NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema/service";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await db.select().from(services).where(eq(services.id, id));
  return NextResponse.json(service);
}
