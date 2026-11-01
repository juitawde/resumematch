import React, { useEffect, useRef, useState } from 'react';

/**
 * Checks if user prefers reduced motion or if pointer device does not support hover (touch).
 */
export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e) => setReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  return reducedMotion;
}

/**
 * TiltCard:
 * A lightweight, high-performance 3D perspective tilt wrapper for cards.
 * Uses pointer events with requestAnimationFrame for 60fps smoothness.
 * Includes dynamic specular glare highlight.
 * Automatically disables on touch devices and for users with prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className = '',
  style = {},
  maxTilt = 5, // maximum tilt degrees
  perspective = 1000,
  scale = 1.012,
  glare = true,
  onClick,
  as: Component = 'div',
  ...props
}) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const rafId = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const handlePointerMove = (e) => {
    if (reducedMotion) return;
    // Disable on touch devices
    if (e.pointerType === 'touch') return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (((y - centerY) / centerY) * -maxTilt).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * maxTilt).toFixed(2);

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      cardRef.current.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      cardRef.current.style.transition = 'transform 0.08s ease-out';
      if (glare && glareRef.current) {
        const glareX = ((x / rect.width) * 100).toFixed(1);
        const glareY = ((y / rect.height) * 100).toFixed(1);
        glareRef.current.style.opacity = '0.14';
        glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0) 65%)`;
        glareRef.current.style.transition = 'opacity 0.12s ease-out';
      }
    });
  };

  const handlePointerLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    cardRef.current.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0';
      glareRef.current.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <Component
      ref={cardRef}
      className={`tilt-card-container ${className}`}
      style={{
        ...style,
        position: 'relative',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      {...props}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="tilt-glare-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 3,
            opacity: 0,
            transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          aria-hidden="true"
        />
      )}
    </Component>
  );
}

/**
 * ScoreCountUp:
 * Animates a score number from 0 to target with easing.
 */
export function ScoreCountUp({ value = 0, duration = 1200 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const target = Number(value) || 0;
    if (reducedMotion || target === 0) {
      setDisplayValue(target);
      return;
    }

    let startTimestamp = null;
    let animId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, reducedMotion]);

  return <span>{displayValue}</span>;
}

/**
 * InteractiveHeroIllustration:
 * Brings the original hero illustration to life with:
 * - Subtle floating badge and sparkles
 * - Gentle mouse-following parallax depth
 * - Preserves the authentic /assets/resume-hero-art.png
 */
export function InteractiveHeroIllustration() {
  const containerRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  const handlePointerMove = (e) => {
    if (reducedMotion || e.pointerType === 'touch') return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: (relX * 12).toFixed(2),
      y: (relY * 12).toFixed(2),
    });
  };

  const handlePointerLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="interactive-hero-art"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Ambient background glow ring */}
      <div className="hero-art-glow" />

      {/* Primary original illustration with smooth parallax */}
      <img
        src="/assets/resume-hero-art.png"
        alt="ResumeMatch Analysis Graphic"
        className="hero-art-image"
        style={{
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
      />

      {/* Interactive floating particles / decorative sparkles */}
      <div
        className="hero-floating-element float-sparkle-1"
        style={{
          transform: `translate3d(${-parallax.x * 1.5}px, ${-parallax.y * 1.5}px, 0)`,
          transition: 'transform 0.2s ease-out',
        }}
      >
        ✦
      </div>
      <div
        className="hero-floating-element float-sparkle-2"
        style={{
          transform: `translate3d(${parallax.x * 1.2}px, ${-parallax.y * 1.2}px, 0)`,
          transition: 'transform 0.2s ease-out',
        }}
      >
        ✧
      </div>
      <div
        className="hero-floating-element float-pill"
        style={{
          transform: `translate3d(${-parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)`,
          transition: 'transform 0.2s ease-out',
        }}
      >
        <span className="float-pill-dot" />
        <span>Evidence-Backed</span>
      </div>
    </div>
  );
}

/**
 * AnimatedAccordionItem:
 * Smooth expandable FAQ item with rotating chevron and height transitions.
 */
export function AnimatedAccordionItem({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`how-faq-accordion-item ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="how-faq-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="how-faq-accordion-title">{title}</span>
        <span className="how-faq-accordion-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chevron-svg"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div className="how-faq-accordion-collapse">
        <div className="how-faq-accordion-body">{children}</div>
      </div>
    </div>
  );
}

