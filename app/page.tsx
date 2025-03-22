"use client"
import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Globe, Sparkles, ChevronRight, ArrowRight, Brain, Heart, Shield } from 'lucide-react';
import { Navbar } from '@/components/NavBar';
import Link from 'next/link';

const characters = [
  {
    name: "Ada",
    role: "Tech Mentor",
    description: "Let's explore the fascinating world of technology together. I can help you learn programming, AI, and more!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
    languages: ["Python", "JavaScript", "Rust"],
    accent: "bg-purple-500",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Marcus",
    role: "Philosophy Guide",
    description: "Explore life's deepest questions and ancient wisdom. Let's discuss philosophy, ethics, and human nature.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    languages: ["Greek", "Latin", "English"],
    accent: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    name: "Sofia",
    role: "Language Tutor",
    description: "Master new languages through natural conversations. I'll help you become fluent while having fun!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200",
    languages: ["Spanish", "French", "Italian"],
    accent: "bg-rose-500",
    gradient: "from-rose-500 to-orange-500"
  },
  {
    name: "Kai",
    role: "Creative Writer",
    description: "Let's craft stories together! I can help with creative writing, poetry, and storytelling techniques.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200",
    languages: ["English", "Japanese", "Korean"],
    accent: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500"
  }
];

const features = [
  {
    icon: Brain,
    title: "Advanced AI",
    description: "Powered by state-of-the-art language models for natural, engaging conversations",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Chat in multiple languages with characters who understand cultural nuances",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Heart,
    title: "Personalized",
    description: "Each character has unique personality traits and expertise areas",
    gradient: "from-rose-500 to-orange-500"
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description: "Your conversations are private and secure, with built-in safety features",
    gradient: "from-emerald-500 to-teal-500"
  }
];

function App() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCharacter, setActiveCharacter] = useState(0);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setActiveCharacter((prev) => (prev + 1) % characters.length);
    }, 5000);

    return () => clearInterval(scrollInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <Navbar/>
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold p-3 mb-8 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 text-transparent bg-clip-text">
              Chat with Characters, Any Language, Anytime
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Experience meaningful conversations with unique personalities in any language
              </p>
              <div className="flex gap-4 justify-center">
                <button className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                  <Link href="/dashboard" className='flex items-center gap-2'>Start Chatting <ArrowRight className="w-5 h-5" /></Link>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-2xl hover:bg-gray-800/50 transition-colors border border-gray-800"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${feature.gradient} p-2 mb-4`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Characters Section */}
      <div className="py-20 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Meet Our Characters</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Each character has their own unique personality, expertise, and way of communicating
          </p>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              {characters.map((character, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
                    activeCharacter === index 
                      ? `bg-gradient-to-r ${character.gradient} scale-105` 
                      : 'bg-gray-800/30 hover:bg-gray-800/50'
                  }`}
                  onClick={() => setActiveCharacter(index)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{character.name}</h3>
                      <p className="text-gray-300">{character.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-300">{character.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {character.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-black/30 rounded-full text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src={characters[activeCharacter].avatar}
                  alt={characters[activeCharacter].name}
                  className="w-full h-full object-cover transition-transform duration-500 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-bold mb-2">{characters[activeCharacter].name}</h3>
                  <p className="text-gray-300 mb-4">{characters[activeCharacter].description}</p>
                  <button className={`bg-gradient-to-r ${characters[activeCharacter].gradient} px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2`}>
                    Start Chat <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-12 rounded-3xl border border-purple-500/20">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
            Ready to Start Chatting?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users having meaningful conversations with our AI characters
          </p>
          <button className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;