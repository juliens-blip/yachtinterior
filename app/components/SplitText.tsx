'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function SplitText({ text, className = '', delay = 0 }: SplitTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const chars = text.split('');
    textRef.current.innerHTML = chars
      .map((char, i) => {
        if (char === ' ') return '<span class="char">&nbsp;</span>';
        return `<span class="char" style="display: inline-block;">${char}</span>`;
      })
      .join('');

    const charElements = textRef.current.querySelectorAll('.char');

    gsap.set(charElements, {
      opacity: 0,
      y: 100,
      rotationX: -90,
      transformOrigin: '50% 50%',
    });

    gsap.to(charElements, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: 'back.out(1.7)',
      delay: delay,
    });
  }, [text, delay]);

  return (
    <div
      ref={textRef}
      className={className}
      style={{
        perspective: '1000px',
        display: 'inline-block',
      }}
    />
  );
}
