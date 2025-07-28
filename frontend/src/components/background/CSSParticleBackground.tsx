'use client';

import React from 'react';

interface CSSParticleBackgroundProps {
  className?: string;
}

const CSSParticleBackground: React.FC<CSSParticleBackgroundProps> = ({ className = "" }) => {
  // Generate particle data - Hot reload test working!
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    color: Math.random() > 0.5 ? '#0EA5E9' : '#14B8A6', // Brand v2 colors
    opacity: Math.random() * 0.6 + 0.3,
  }));

  return (
    <>
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) translateX(0px) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(90vh) translateX(0px) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(-10vh) translateX(var(--random-x)) scale(1);
          }
          100% {
            transform: translateY(-20vh) translateX(var(--random-x)) scale(0);
            opacity: 0;
          }
        }

        @keyframes float-diagonal {
          0% {
            transform: translateY(100vh) translateX(-50px) scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(90vh) translateX(-30px) scale(1) rotate(45deg);
          }
          90% {
            opacity: 1;
            transform: translateY(-10vh) translateX(var(--random-x)) scale(1) rotate(405deg);
          }
          100% {
            transform: translateY(-20vh) translateX(var(--random-x)) scale(0) rotate(450deg);
            opacity: 0;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
          }
          50% {
            box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
          }
        }

        @keyframes background-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .css-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .particle-bg {
          background: linear-gradient(135deg, #082F49 0%, #0369A1 25%, #14B8A6 50%, #0EA5E9 75%, #082F49 100%);
          background-size: 400% 400%;
          animation: background-shift 20s ease infinite;
        }
      `}</style>
      
      <div 
        className={`absolute inset-0 w-full h-full particle-bg overflow-hidden ${className}`}
        style={{ zIndex: 1 }}
      >
        {/* Animated particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="css-particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              animationName: particle.id % 2 === 0 ? 'float-up' : 'float-diagonal',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
              '--random-x': `${Math.random() * 200 - 100}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Additional glowing orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
            filter: 'blur(2px)',
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite 1s',
            filter: 'blur(1px)',
          }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)',
            animation: 'pulse-glow 5s ease-in-out infinite 2s',
            filter: 'blur(3px)',
          }}
        />

      </div>
    </>
  );
};

export default CSSParticleBackground;