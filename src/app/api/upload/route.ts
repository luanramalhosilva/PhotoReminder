import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs/promises";
import path from "path";

// Função utilitária para converter um Buffer em um Readable stream (exigido pelo googleapis)
function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Função para gerar data e hora no formato DD-MM-YYYY_HHhMMm
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
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const guestName = formData.get("guestName") as string || "Anonimo";

    // Sanitiza o nome do convidado: remove espaços extras e substitui espaços por '_'
    const sanitizedGuestName = guestName.trim().replace(/\s+/g, "_");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    const dateTime = getFormattedDateTime();

    if (isDevelopment) {
      // Salvar na pasta local durante o desenvolvimento
      const baseDir = "C:\\Users\\luanr\\Documents\\FOTOS";
      await fs.mkdir(baseDir, { recursive: true });

      // Lê as pastas existentes para descobrir o próximo número sequencial
      const existingEntries = await fs.readdir(baseDir, { withFileTypes: true });
      let maxNumber = 0;

      for (const entry of existingEntries) {
        if (entry.isDirectory()) {
          const match = entry.name.match(/^(\d+)-/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
          }
        }
      }

      const nextNumber = (maxNumber + 1).toString().padStart(2, "0");
      const folderName = `${nextNumber}-${sanitizedGuestName}_${dateTime}`;
      const guestFolder = path.join(baseDir, folderName);
      
      // Cria a pasta do envio
      await fs.mkdir(guestFolder, { recursive: true });

      const uploadPromises = files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Mantemos o nome original do arquivo (pode usar timestamp tbm pra não ter choque)
        const fileTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${fileTimestamp}-${file.name}`;
        const filePath = path.join(guestFolder, fileName);

        await fs.writeFile(filePath, buffer);
      });

      await Promise.all(uploadPromises);
      
      console.log(`[DEV] ${files.length} foto(s) salva(s) com sucesso em ${guestFolder}`);
      return NextResponse.json({ success: true, local: true });
      
    } else {
      // Produção: Salvar no Google Drive
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!clientEmail || !privateKey || !rootFolderId) {
        console.warn("Credenciais do Google Drive não configuradas.");
        return NextResponse.json(
          { error: "Erro de configuração do servidor." },
          { status: 500 }
        );
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Passo 1: Listar pastas existentes no Google Drive para pegar o maior número
      const query = `mimeType='application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed=false`;
      const searchRes = await drive.files.list({
        q: query,
        fields: "files(name)",
        spaces: "drive",
      });

      let maxNumber = 0;
      if (searchRes.data.files) {
        for (const file of searchRes.data.files) {
          if (file.name) {
            const match = file.name.match(/^(\d+)-/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNumber) maxNumber = num;
            }
          }
        }
      }

      const nextNumber = (maxNumber + 1).toString().padStart(2, "0");
      const folderName = `${nextNumber}-${sanitizedGuestName}_${dateTime}`;

      // Passo 2: Criar a nova pasta sequencial para este envio
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      };
      
      const folderRes = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });
      
      const targetFolderId = folderRes.data.id!;

      // Passo 3: Fazer o upload dos arquivos para a pasta recém-criada
      const uploadPromises = files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${fileTimestamp}-${file.name}`;

        const fileMetadata = {
          name: fileName,
          parents: [targetFolderId],
        };

        const media = {
          mimeType: file.type,
          body: bufferToStream(buffer),
        };

        return drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id",
        });
      });

      await Promise.all(uploadPromises);

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao tentar enviar as fotos." },
      { status: 500 }
    );
  }
}
