"use client";

import { useSession } from "next-auth/react";
import { Heart, ImageIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Photo = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch("/api/gallery")
        .then((res) => res.json())
        .then((data) => {
          if (data.photos) setPhotos(data.photos);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [session]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f8]">Carregando...</div>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f8]">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
          <Heart className="w-12 h-12 text-wedding-gold mb-6" />
          <h1 className="font-serif text-2xl font-medium mb-4 text-wedding-dark">Galeria de Fotos</h1>
          <p className="text-gray-600 font-sans">Faça login na tela inicial para ver as fotos do casamento.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#faf9f8] pb-24">
      <div className="pt-12 pb-8 px-6 text-center bg-white shadow-sm rounded-b-3xl sticky top-0 z-10">
        <h1 className="font-serif text-3xl text-wedding-dark font-medium mb-2">Galeria</h1>
        <p className="font-sans text-gray-500 max-w-xs mx-auto text-sm">
          Todos os momentos incríveis compartilhados pelos convidados.
        </p>
      </div>

      <div className="flex-1 px-4 pt-6 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-wedding-gold" />
            <p>Carregando as lembranças...</p>
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm"
              >
                {/* O Google Drive 'uc' endpoint serve a imagem diretamente */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center mt-4">
            <div className="w-16 h-16 bg-wedding-rose rounded-full flex items-center justify-center mb-4 text-wedding-gold">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Nenhuma foto ainda</h3>
            <p className="text-sm text-gray-500">
              Seja o primeiro a enviar uma foto para a galeria!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
