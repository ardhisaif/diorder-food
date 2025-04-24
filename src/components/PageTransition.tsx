import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const PageTransitionContent: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 bg-gradient-to-r from-orange-500 to-orange-300">
      <div className="h-full w-full animate-loading-bar bg-orange-500"></div>
    </div>
  );
};

// This wrapper component doesn't use any Router hooks directly
const PageTransition: React.FC = () => {
  return null; // This component now does nothing at the App.tsx level
};

// Export both components
export default PageTransition;
export { PageTransitionContent };
