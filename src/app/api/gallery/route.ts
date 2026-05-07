import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey || !rootFolderId) {
      return NextResponse.json({ error: "Configurações do Google Drive ausentes" }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Buscar todos os arquivos dentro da pasta do casamento
    // (Poderíamos usar q: `'${rootFolderId}' in parents` se tivéssemos subpastas, precisaria de uma busca recursiva,
    // mas agora as imagens estão sendo enviadas diretamente para a raiz do rootFolderId)
    const response = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 100, // Ajuste caso necessário
    });

    const files = response.data.files || [];

    const photos = files.map((file) => ({
      id: file.id,
      name: file.name,
      // Usamos a URL de visualização padrão do Drive para imagens com permissão pública
      url: `https://drive.google.com/uc?export=view&id=${file.id}`,
      createdAt: file.createdTime,
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Erro ao buscar galeria no Google Drive:", error);
    return NextResponse.json({ error: "Erro ao buscar galeria" }, { status: 500 });
  }
}
