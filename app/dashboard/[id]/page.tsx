"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VoiceAssistant from "@/app/voice-assistant";

export default function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        console.log(id)
        const res = await fetch(`https://aiverse.exam24.xyz/v1/characters/${id}`);
        if (!res.ok) throw new Error("Character not found");
        const data = await res.json();
        setCharacter(data);
      } catch (error) {
        console.error("Error fetching character:", error);
      }
    };

    fetchCharacter();
  }, [id]);

  if (!character) return <p className="text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white p-8">
      <h1 className="text-2xl">Hey Chat with<span className="font-bold"> {character.name}</span></h1>
      <p className="text-gray-400 mt-2"><span className="font-bold">Character Description:- </span>{character.prompt}</p>
      <img src={character.profile_image_url} className="h-64 w-64"></img>
      <div>
      <VoiceAssistant id={id} />
      </div>
    </div>
  );
}
