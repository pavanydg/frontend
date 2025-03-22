"use client"
import React, { useEffect, useState } from 'react';
import { Search, Plus, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import { CharacterCard } from '@/components/CharacterCard.';
import VoiceAssistant from '../voice-assistant';
import CharacterModal from '../Create';

export default function dash () {
    const [characters, setCharacters] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
      const fetchCharacters = async () => {
        try {
          const res = await fetch("https://aiverse.exam24.xyz/v1/characters");
          if (!res.ok) throw new Error("Failed to fetch characters");
          const data = await res.json();
          setCharacters(data || []); 
        } catch (error) {
          console.error("Error fetching characters:", error);
        }
      };
  
      fetchCharacters();
    }, []);

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#212226] p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-semibold">converse.ai</h1>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition rounded-full px-4 py-2"
        >
          <Plus size={20} />
          <span>Create</span>
        </button>
        
        <button className="flex items-center gap-2 bg-[#2a2b30] hover:bg-[#32333a] transition rounded-lg px-4 py-2">
          <Sparkles size={20} />
          <span>Discover Characters</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-gray-400">Welcome back,</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                U
              </div>
              <h2 className="text-xl">User</h2>
            </div>
          </div>

          <div className='text-xl font-sans py-4'>Chat with Below Characters</div>
          <div className="cursor-pointer grid grid-cols-4 gap-4">
            {characters.length > 0 ? (
              characters.map((char) => (
                <CharacterCard key={char.id} id={char.id} name={char.name} prompt={char.prompt} profile_image_url={char.profile_image_url} />
              ))
            ) : (
              <p>Loading characters...</p>
            )}
          </div>
          {/* <VoiceAssistant/> */}
        </div>
      </main>
      <CharacterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
