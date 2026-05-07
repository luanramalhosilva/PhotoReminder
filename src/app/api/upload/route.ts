import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const guestName = searchParams.get('guestName') || 'Anonimo';

    if (!filename || !request.body) {
      return NextResponse.json({ error: 'Faltando arquivo ou nome' }, { status: 400 });
    }

    // Gerar um nome único e seguro usando a data/hora e o nome do convidado
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedGuestName = guestName.trim().replace(/\s+/g, "_");
    const uniqueFilename = `${timestamp}-${sanitizedGuestName}-${filename}`;

    // Upload direto para o Vercel Blob
    const blob = await put(uniqueFilename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error("Erro no upload para o Blob:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar enviar a foto." },
      { status: 500 }
    );
  }
}
