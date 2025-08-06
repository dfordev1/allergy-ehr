import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  const isLargeScreen = windowSize.width >= breakpoints.xl;

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    breakpoints: {
      isSm: windowSize.width >= breakpoints.sm,
      isMd: windowSize.width >= breakpoints.md,
      isLg: windowSize.width >= breakpoints.lg,
      isXl: windowSize.width >= breakpoints.xl,
    },
  };
}

export function useMobileFirst() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    // Helper functions for conditional rendering
    showOnMobile: (content: React.ReactNode) => isMobile ? content : null,
    showOnTablet: (content: React.ReactNode) => isTablet ? content : null,
    showOnDesktop: (content: React.ReactNode) => isDesktop ? content : null,
    hideOnMobile: (content: React.ReactNode) => !isMobile ? content : null,
  };
}