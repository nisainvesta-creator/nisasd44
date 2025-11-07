import React from 'react';

interface FloatingChatButtonProps {
  onClick: () => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const imageUrl = "https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050185714.jpg";

  return (
    <button onClick={onClick} className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full shadow-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400" aria-label="Open customer service chat" title="Customer service chat">
      {!imgError ? (
        <img
          src={imageUrl}
          alt="Chat support"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <span className="sr-only">Open customer service chat</span>
    </button>
  );
};

export default FloatingChatButton;
