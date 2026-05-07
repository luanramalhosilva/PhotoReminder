"use client";

import { useSession } from "next-auth/react";
import { Heart, MessageSquareHeart } from "lucide-react";

export default function MessagesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f8]">Carregando...</div>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f8]">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
          <Heart className="w-12 h-12 text-wedding-gold mb-6" />
          <h1 className="font-serif text-2xl font-medium mb-4 text-wedding-dark">Mural de Recados</h1>
          <p className="text-gray-600 font-sans">Faça login na tela inicial para deixar uma mensagem aos noivos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#faf9f8] pb-24">
      <div className="pt-12 pb-8 px-6 text-center bg-white shadow-sm rounded-b-3xl sticky top-0 z-10">
        <h1 className="font-serif text-3xl text-wedding-dark font-medium mb-2">Recados</h1>
        <p className="font-sans text-gray-500 max-w-xs mx-auto text-sm">
          Deixe uma mensagem de carinho para guardar de lembrança.
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col max-w-md mx-auto w-full">
        {/* Placeholder for real messages when DB is connected */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-wedding-rose rounded-full flex items-center justify-center mb-4 text-wedding-gold">
            <MessageSquareHeart className="w-8 h-8" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Mural em Construção</h3>
          <p className="text-sm text-gray-500">
            Assim que configurarmos o banco de dados, você poderá escrever e ler todas as mensagens deixadas pelos convidados.
          </p>
        </div>
      </div>
    </main>
  );
}
