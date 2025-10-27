import React from 'react';

type Props = { children: React.ReactNode };

// Stub ad gate – always renders children.
export default function AdsGate({ children }: Props) {
  return <>{children}</>;
}


