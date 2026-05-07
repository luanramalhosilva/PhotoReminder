-- 1. Criar a tabela de fotos
CREATE TABLE public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS na tabela de fotos (opcional, mas recomendado)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir que qualquer um leia as fotos
CREATE POLICY "Fotos são públicas para leitura" 
ON public.photos FOR SELECT 
USING (true);

-- 4. Criar política para permitir inserção anônima (ou pela service role, que ignora RLS)
CREATE POLICY "Permitir inserção de fotos" 
ON public.photos FOR INSERT 
WITH CHECK (true);

-- 5. Criar o bucket de armazenamento para as imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-photos', 'wedding-photos', true);

-- 6. Criar política para permitir leitura pública no bucket
CREATE POLICY "Imagens públicas para leitura" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'wedding-photos');

-- 7. Criar política para permitir upload no bucket
CREATE POLICY "Permitir uploads no bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'wedding-photos');

-- ==========================================
-- MENSAGENS DOS CONVIDADOS
-- ==========================================

-- 8. Criar a tabela de mensagens
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_image TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Habilitar RLS na tabela de mensagens
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 10. Criar política para permitir que qualquer um leia as mensagens
CREATE POLICY "Mensagens são públicas para leitura" 
ON public.messages FOR SELECT 
USING (true);

-- 11. Criar política para permitir inserção de mensagens
CREATE POLICY "Permitir inserção de mensagens" 
ON public.messages FOR INSERT 
WITH CHECK (true);

