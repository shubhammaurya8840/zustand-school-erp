'use client';

import React from 'react';

export const motion = {
  div: React.forwardRef<HTMLDivElement, any>(function MotionDiv(
    { initial, animate, exit, transition, whileHover, whileTap, ...props },
    ref
  ) {
    return <div ref={ref} {...props} />;
  }),
  button: React.forwardRef<HTMLButtonElement, any>(function MotionButton(
    { initial, animate, exit, transition, whileHover, whileTap, ...props },
    ref
  ) {
    return <button ref={ref} {...props} />;
  }),
  span: React.forwardRef<HTMLSpanElement, any>(function MotionSpan(
    { initial, animate, exit, transition, whileHover, whileTap, ...props },
    ref
  ) {
    return <span ref={ref} {...props} />;
  }),
  p: React.forwardRef<HTMLParagraphElement, any>(function MotionP(
    { initial, animate, exit, transition, whileHover, whileTap, ...props },
    ref
  ) {
    return <p ref={ref} {...props} />;
  }),
  tr: React.forwardRef<HTMLTableRowElement, any>(function MotionTr(
    { initial, animate, exit, transition, whileHover, whileTap, ...props },
    ref
  ) {
    return <tr ref={ref} {...props} />;
  }),
};

export const AnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

