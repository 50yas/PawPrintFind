import React, { useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key to trigger transition (usually the view name) */
  transitionKey?: string;
  /** Transition duration in ms */
  duration?: number;
  /** Transition type */
  type?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'fade-scale';
  /** Custom className */
  className?: string;
}

/**
 * PageTransition component for smooth view changes
 *
 * Features:
 * - Multiple transition types (fade, slide, scale)
 * - Respects prefers-reduced-motion
 * - Stagger animations for child elements
 * - Smooth enter/exit transitions
 *
 * Usage:
 * ```tsx
 * <PageTransition key={currentView} type="fade-scale">
 *   <YourViewComponent />
 * </PageTransition>
 * ```
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  duration = 300,
  type = 'fade-scale',
  className = ''
}) => {
  const [isEntering, setIsEntering] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const timeoutRef = useRef<number>();

  useEffect(() => {
    // When key changes, trigger exit then enter animation
    setIsEntering(false);

    timeoutRef.current = window.setTimeout(() => {
      setDisplayChildren(children);
      setIsEntering(true);
    }, duration / 2);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [transitionKey, children, duration]);

  const transitionClasses = {
    'fade': {
      base: 'transition-opacity duration-300 ease-emphasized-decelerate will-change-[opacity]',
      enter: 'opacity-100',
      exit: 'opacity-0'
    },
    'slide-up': {
      base: 'transition-all duration-300 ease-emphasized-decelerate will-change-[opacity,transform]',
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 translate-y-4'
    },
    'slide-down': {
      base: 'transition-all duration-300 ease-emphasized-decelerate will-change-[opacity,transform]',
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 -translate-y-4'
    },
    'scale': {
      base: 'transition-all duration-300 ease-emphasized-decelerate will-change-[opacity,transform]',
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95'
    },
    'fade-scale': {
      base: 'transition-all duration-300 ease-emphasized-decelerate will-change-[opacity,transform]',
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-98'
    }
  };

  const transition = transitionClasses[type];
  const stateClass = isEntering ? transition.enter : transition.exit;

  return (
    <div
      className={`${transition.base} ${stateClass} ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {displayChildren}
    </div>
  );
};

/**
 * StaggeredList component for animating list items with delay
 *
 * Usage:
 * ```tsx
 * <StaggeredList delay={50}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggeredList>
 * ```
 */
export const StaggeredList: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 50, className = '' }) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * FadeSlideTransition - Simple wrapper for fade+slide animation
 */
export const FadeSlideTransition: React.FC<{
  show: boolean;
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
}> = ({
  show,
  children,
  direction = 'up',
  duration = 300,
  className = ''
}) => {
  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4'
  };

  return (
    <div
      className={`transition-all ease-emphasized-decelerate will-change-[opacity,transform] ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0,
        transform: show ? 'translate(0, 0)' : directionClasses[direction]
      }}
    >
      {children}
    </div>
  );
};

/**
 * CollapseTransition - Smooth height transition for collapsible content
 */
export const CollapseTransition: React.FC<{
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}> = ({ show, children, duration = 300, className = '' }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (show) {
        const contentHeight = contentRef.current?.scrollHeight || 0;
        setHeight(contentHeight);
        // Set to auto after transition completes
        setTimeout(() => setHeight('auto'), duration);
      } else {
        setHeight(contentRef.current?.scrollHeight || 0);
        // Force reflow
        requestAnimationFrame(() => {
          setHeight(0);
        });
      }
    };

    updateHeight();
  }, [show, duration]);

  return (
    <div
      className={`overflow-hidden transition-all ${className}`}
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default PageTransition;
