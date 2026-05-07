import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guest_name, guest_email, guest_image, message } = body;

    if (!guest_name || !message) {
      return NextResponse.json({ error: "Nome e mensagem são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        { guest_name, guest_email, guest_image, message }
      ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 });
  }
}
