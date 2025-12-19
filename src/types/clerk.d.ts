import { UserPublicMetadata } from '@clerk/types';

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: string;
    };
  }
}

export {};