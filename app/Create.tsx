"use client";
import { useState } from "react";

export default function CharacterModal({ isOpen, onClose }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!id || !name || !prompt) return alert("All fields are required!");
    setLoading(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      id: Number(id),
      name,
      prompt,
      profile_image_url: profileImageUrl,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const res = await fetch("https://aiverse.exam24.xyz/v1/characters", requestOptions);
      if (!res.ok) throw new Error("Failed to create character");

      alert("Character created successfully!");
      onClose(); // Close modal after success
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating character!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-[#212226] p-6 rounded-lg w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Add New Character</h2>
        <input
          type="number"
          placeholder="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
        />
        <textarea
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
        />
        <input
          type="text"
          placeholder="Profile Image URL"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 rounded disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
