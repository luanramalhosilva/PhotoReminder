import { NextResponse } from "next/server";
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { blobs } = await list({
      limit: 100, // Limite de fotos a mostrar na galeria
    });

    const photos = blobs.map((blob) => ({
      id: blob.url,
      name: blob.pathname,
      url: blob.url,
      createdAt: blob.uploadedAt,
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Erro ao buscar galeria no Vercel Blob:", error);
    return NextResponse.json({ error: "Erro ao buscar galeria" }, { status: 500 });
  }
}
