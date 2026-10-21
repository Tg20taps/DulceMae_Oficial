import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// Anticipated section reveal: trigger before the section reaches the center,
// then keep it visible to avoid scroll-back flicker. Sólo opacidad y
// movimiento: el desenfoque obligaba a repintar la sección entera en cada
// cuadro, y en un celular se notaba.
export default function SectionWrapper({ children, id, className = '', delay = 0 }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { margin: '0px 0px 28% 0px', once: true });

  const visibleState = { opacity: 1, y: 0 };
  const hiddenState = prefersReducedMotion
    ? visibleState
    : { opacity: 0, y: 26 };

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={hiddenState}
      animate={isInView ? visibleState : hiddenState}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: isInView ? delay : 0,
      }}
    >
      {children}
    </motion.div>
  );
}
