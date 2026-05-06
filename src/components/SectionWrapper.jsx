import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// Anticipated section reveal: trigger before the section reaches the center,
// then keep it visible to avoid scroll-back flicker.
export default function SectionWrapper({ children, id, className = '', delay = 0 }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { margin: '0px 0px 28% 0px', once: true });

  const visibleState = { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' };
  const hiddenState = prefersReducedMotion
    ? visibleState
    : { opacity: 0, scale: 0.985, y: 26, filter: 'blur(10px)' };

  return (
    <motion.div
      ref={ref}
      id={id}
      className={`dm-gpu ${className}`}
      initial={hiddenState}
      animate={isInView ? visibleState : hiddenState}
      transition={{
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
        delay: isInView ? delay : 0,
      }}
      style={{ transformOrigin: 'center top' }}
    >
      {children}
    </motion.div>
  );
}
