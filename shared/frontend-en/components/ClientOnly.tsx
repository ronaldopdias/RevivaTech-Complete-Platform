import React, { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Ensure this only runs on the client to prevent hydration mismatches
const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // During SSR or before hydration, show fallback
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Set display name for debugging
ClientOnly.displayName = 'ClientOnly';

export { ClientOnly };