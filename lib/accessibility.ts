/**
 * Accessibility utilities and hooks
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage focus trap within a container
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'polite' | 'assertive'>('polite');
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcement && announcementRef.current) {
      // Clear and re-set to ensure announcement is read
      announcementRef.current.textContent = '';
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = announcement;
        }
      }, 100);
    }
  }, [announcement]);

  const announce = (message: string, type: 'polite' | 'assertive' = 'polite') => {
    setAnnouncementType(type);
    setAnnouncement(message);
  };

  const AnnouncementRegion = () => {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('div', {
        ref: announcementRef,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        className: 'sr-only',
        style: { display: announcementType === 'polite' ? 'block' : 'none' }
      }),
      React.createElement(
        'div',
        {
          role: 'alert',
          'aria-live': 'assertive',
          'aria-atomic': 'true',
          className: 'sr-only',
          style: { display: announcementType === 'assertive' ? 'block' : 'none' }
        },
        announcementType === 'assertive' ? announcement : ''
      )
    );
  };

  return { announce, AnnouncementRegion };
}

/**
 * Hook to manage keyboard navigation
 */
export function useKeyboardNavigation(options: {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  isActive?: boolean;
}) {
  const { isActive = true } = options;

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (options.onArrowUp) {
            e.preventDefault();
            options.onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (options.onArrowDown) {
            e.preventDefault();
            options.onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (options.onArrowLeft) {
            e.preventDefault();
            options.onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (options.onArrowRight) {
            e.preventDefault();
            options.onArrowRight();
          }
          break;
        case 'Enter':
          if (options.onEnter) {
            e.preventDefault();
            options.onEnter();
          }
          break;
        case 'Escape':
          if (options.onEscape) {
            e.preventDefault();
            options.onEscape();
          }
          break;
        case ' ':
        case 'Space':
          if (options.onSpace) {
            e.preventDefault();
            options.onSpace();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, options]);
}

/**
 * Hook to manage roving tabindex for lists
 */
export function useRovingTabIndex(itemCount: number, isActive: boolean = true) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
    }
  };

  const getTabIndex = (index: number) => {
    return index === focusedIndex ? 0 : -1;
  };

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex
  };
}

/**
 * Utility to generate unique IDs for accessibility
 */
let idCounter = 0;
export function useUniqueId(prefix: string = 'id') {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * CSS class for screen reader only content
 */
export const srOnly = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Get appropriate ARIA label for loading states
 */
export function getLoadingLabel(context: string): string {
  return `Loading ${context}. Please wait.`;
}

/**
 * Get appropriate ARIA label for error states
 */
export function getErrorLabel(error: string, context: string): string {
  return `Error in ${context}: ${error}`;
}

/**
 * Format number as ordinal for screen readers
 */
export function formatOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Debounce announcements to prevent overwhelming screen readers
 */
export function createAnnouncementQueue() {
  let queue: string[] = [];
  let timeout: NodeJS.Timeout | null = null;
  
  return {
    add: (message: string, announcer: (msg: string) => void, delay: number = 500) => {
      queue.push(message);
      
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        if (queue.length > 0) {
          // Announce all messages at once
          announcer(queue.join('. '));
          queue = [];
        }
      }, delay);
    },
    
    clear: () => {
      queue = [];
      if (timeout) clearTimeout(timeout);
    }
  };
}