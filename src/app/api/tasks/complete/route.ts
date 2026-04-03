import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export async function POST(req: NextRequest) {
  try {
    const { taskId } = await req.json();

    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .eq('tenant_id', TENANT_ID);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
