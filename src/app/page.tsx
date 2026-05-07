"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, UploadCloud, X, CheckCircle2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f8]">Carregando...</div>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f8]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center"
        >
          <Heart className="w-12 h-12 text-wedding-gold mb-6" />
          <h1 className="font-serif text-3xl font-medium mb-4 text-wedding-dark">Nosso Casamento</h1>
          <p className="text-gray-600 mb-8 font-sans">
            Faça login para compartilhar as fotos que você tirou e ver a galeria com todos os convidados!
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-wedding-dark text-white font-medium py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </motion.div>
      </main>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("guestName", session.user?.name || "Anonimo");
    formData.append("guestEmail", session.user?.email || "");
    formData.append("guestImage", session.user?.image || "");
    
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (res.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          setIsSuccess(true);
          setIsUploading(false);
          setFiles([]);
        }, 500);
      } else {
        alert("Ocorreu um erro ao enviar as fotos. Tente novamente.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro na conexão. Tente novamente.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f8]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-wedding-rose rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-wedding-gold" />
          </div>
          <h1 className="font-serif text-3xl font-medium mb-4 text-wedding-dark">Muito Obrigado!</h1>
          <p className="text-gray-600 mb-8 font-sans">
            Suas fotos foram enviadas e já estão na galeria.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setUploadProgress(0);
            }}
            className="w-full bg-wedding-dark text-white font-medium py-4 rounded-full transition-transform active:scale-95"
          >
            Enviar mais fotos
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#faf9f8] pb-24">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center bg-white shadow-sm rounded-b-3xl">
        {session.user?.image ? (
          <img src={session.user.image} alt={session.user.name || "User"} className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-wedding-gold/20" />
        ) : (
          <Heart className="w-8 h-8 text-wedding-gold mx-auto mb-4" />
        )}
        <h1 className="font-serif text-2xl text-wedding-dark font-medium mb-2">
          Olá, {session.user?.name?.split(" ")[0]}!
        </h1>
        <p className="font-sans text-gray-500 max-w-xs mx-auto text-sm">
          Compartilhe as melhores lembranças com a gente.
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col max-w-md mx-auto w-full">
        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-wedding-rose flex items-center justify-center text-wedding-gold">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm text-gray-700">Galeria</span>
          </button>
          
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
                setTimeout(() => fileInputRef.current?.removeAttribute("capture"), 1000);
              }
            }}
            className="flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-wedding-rose flex items-center justify-center text-wedding-gold">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm text-gray-700">Câmera</span>
          </button>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Selected Files Preview */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <h2 className="font-serif text-xl mb-4 text-wedding-dark flex items-center justify-between">
                <span>Fotos Selecionadas</span>
                <span className="text-sm font-sans bg-wedding-gold text-white px-3 py-1 rounded-full">
                  {files.length}
                </span>
              </h2>
              
              <div className="grid grid-cols-3 gap-2 mb-8">
                {files.map((file, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={`${file.name}-${index}`}
                    className="relative aspect-square rounded-xl overflow-hidden shadow-sm"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Upload */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50"
          >
            <div className="max-w-md mx-auto">
              {isUploading ? (
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
                    <span>Enviando fotos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-wedding-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "easeInOut" }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="w-full bg-wedding-dark text-white font-medium py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-wedding-dark/20"
                >
                  <UploadCloud className="w-5 h-5" />
                  Enviar {files.length} {files.length === 1 ? 'foto' : 'fotos'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

