import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const guestName = searchParams.get('guestName') || 'Anonimo';

    if (!filename || !request.body) {
      return NextResponse.json({ error: 'Faltando arquivo ou nome' }, { status: 400 });
    }

    // Gerar um nome único
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedGuestName = guestName.trim().replace(/\s+/g, "_");
    const uniqueFilename = `${timestamp}-${sanitizedGuestName}-${filename}`;

    // Upload para o Supabase Storage (Bucket 'wedding-photos')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('wedding-photos')
      .upload(uniqueFilename, request.body, {
        cacheControl: '3600',
        upsert: false,
        duplex: 'half' // Necessário no Next.js App Router para Streams
      });

    if (storageError) {
      throw storageError;
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(uniqueFilename);

    const publicUrl = publicUrlData.publicUrl;

    // Salvar no banco de dados
    const { error: dbError } = await supabase
      .from('photos')
      .insert([
        { url: publicUrl, guest_name: guestName }
      ]);

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Erro no upload para o Supabase:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar enviar a foto." },
      { status: 500 }
    );
  }
}
