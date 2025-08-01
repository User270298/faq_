'use client';

export default function CTAButton() {
  const handleClick = () => {
    // Trigger FAQ widget to open
    const event = new CustomEvent('openFAQ');
    window.dispatchEvent(event);
  };

  return (
    <button 
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
      onClick={handleClick}
    >
      Начать общение
    </button>
  );
} 