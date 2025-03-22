import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                Converse.AI
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#characters" className="text-gray-300 hover:text-white transition-colors">Characters</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <button className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 rounded-full font-semibold hover:scale-105 transition-transform">
                Get Started
              </button>
            </div>
  
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
  
          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <a href="#features" className="block py-2 text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#characters" className="block py-2 text-gray-300 hover:text-white transition-colors">Characters</a>
              <a href="#about" className="block py-2 text-gray-300 hover:text-white transition-colors">About</a>
              <button className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 rounded-full font-semibold hover:scale-105 transition-transform">
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  }
