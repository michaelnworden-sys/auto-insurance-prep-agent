import React, { useState, useEffect } from 'react';
import { IMAGE_MAP } from '../constants';

interface ImagePanelProps {
  imageKey: string;
  story: string[] | null;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({ imageKey, story }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const { src, alt, topic, type } = IMAGE_MAP[imageKey] || IMAGE_MAP['default'];

  // Reset to the first frame whenever the story topic changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [story]);

  const handleNextFrame = () => {
    if (story && currentFrame < story.length - 1) {
      setCurrentFrame(prev => prev + 1);
    }
  };

  const handlePrevFrame = () => {
    if (currentFrame > 0) {
      setCurrentFrame(prev => prev - 1);
    }
  };

  const mediaElement = type === 'video' ? (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="object-cover w-full h-full transition-all duration-500 ease-in-out transform group-hover:scale-105"
      aria-label={alt}
    />
  ) : (
    <img
      key={src}
      src={src}
      alt={alt}
      className="object-cover w-full h-full transition-all duration-500 ease-in-out transform group-hover:scale-105"
    />
  );

  const isFirstFrame = currentFrame === 0;
  const isLastFrame = story ? currentFrame === story.length - 1 : true;
  const hasMultipleFrames = story ? story.length > 1 : false;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <div className="absolute inset-0 w-full h-full animate-fade-in-media">
        {mediaElement}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
      
      <div className="absolute bottom-[3%] left-[3%] right-[3%] md:bottom-[1%] md:left-[1%] md:right-[1%] bg-black/50 backdrop-blur-sm p-5 rounded-lg shadow-2xl animate-slide-up text-left flex items-center">
        <div className="flex-grow pr-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
            {topic}
            </h2>
            {story && story.length > 0 && (
                <p key={currentFrame} className="text-white/90 text-sm md:text-base leading-relaxed font-normal animate-fade-in-text">{story[currentFrame]}</p>
            )}
        </div>
        
        {hasMultipleFrames && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <button
              onClick={handlePrevFrame}
              disabled={isFirstFrame}
              className="bg-black/40 hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed text-cyan-300 rounded-full p-1.5 transition-all"
              aria-label="Previous story frame"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            <span className="text-xs font-mono text-white/60 select-none">
              {currentFrame + 1}/{story.length}
            </span>
            <button
              onClick={handleNextFrame}
              disabled={isLastFrame}
              className="bg-black/40 hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed text-cyan-300 rounded-full p-1.5 transition-all"
              aria-label="Next story frame"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in-media {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-text {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-media { animation: fade-in-media 0.7s ease-in-out forwards; }
        .animate-fade-in-text { animation: fade-in-text 0.3s ease-in-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s ease-out 0.2s backwards; }
      `}</style>
    </div>
  );
};