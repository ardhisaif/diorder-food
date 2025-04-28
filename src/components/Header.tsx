import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = false }) => {
  const navigate = useNavigate();

  const handleWhatsAppChat = () => {
    const message = encodeURIComponent("Halo, saya ingin bertanya sesuatu.");
    window.open(`https://wa.me/628888465289?text=${message}`, "_blank");
  };

  return (
    <header className="bg-orange-500 text-white py-4 px-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {showBack && (
            <button onClick={() => navigate(-1)} className="mr-3">
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <button onClick={handleWhatsAppChat} className="relative" aria-label="Buka Chat">
          <MessageCircle size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;
