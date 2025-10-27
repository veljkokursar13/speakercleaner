import React from 'react';

type Props = {
  children: React.ReactNode;
};

// Stub premium gate – always allows content for now.
export default function PremiumGate({ children }: Props) {
  return <>{children}</>;
}


