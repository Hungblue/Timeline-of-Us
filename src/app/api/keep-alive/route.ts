import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Supabase gói free tự pause project sau 7 ngày không có truy vấn nào.
// Vercel Cron (vercel.json) gọi route này mỗi ngày để giữ database luôn thức.
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await supabase.from("bucket_list").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
