import { createContext, useContext } from 'react';
import type { WizardRouter } from '../router.js';

export const RouterContext = createContext<WizardRouter | null>(null);

export function useRouter(): WizardRouter {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter must be used within a RouterProvider');
  return router;
}
