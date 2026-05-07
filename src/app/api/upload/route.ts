import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs/promises";
import path from "path";

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function getFormattedDateTime() {
  const now = new Date();
  const d = now.getDate().toString().padStart(2, "0");
  const mo = (now.getMonth() + 1).toString().padStart(2, "0");
  const y = now.getFullYear();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${d}-${mo}-${y}_${h}h${m}m`;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'image.jpg';
    const guestName = searchParams.get('guestName') || 'Anonimo';

    if (!request.body) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    const dateTime = getFormattedDateTime();
    const sanitizedGuestName = guestName.trim().replace(/\s+/g, "_");

    // Google Drive Upload Only
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey || !rootFolderId) {
      console.warn("Credenciais do Google Drive não configuradas.");
      return NextResponse.json({ error: "Erro de configuração." }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Converter body em buffer
    const arrayBuffer = await new Response(request.body).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uniqueFileName = `${fileTimestamp}-${sanitizedGuestName}-${filename}`;

    const fileMetadata = {
      name: uniqueFileName,
      parents: [rootFolderId],
    };

    const media = {
      mimeType: "image/jpeg", // or detect from file
      body: bufferToStream(buffer),
    };

    // Upload
    const fileRes = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = fileRes.data.id!;

    // Make public so anyone can view it in the gallery
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return NextResponse.json({ success: true, fileId });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar enviar a foto." },
      { status: 500 }
    );
  }
}
