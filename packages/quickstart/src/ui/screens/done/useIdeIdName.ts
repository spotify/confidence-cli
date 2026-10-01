import { getIntegration } from '@spotify-confidence/core';
import { useSession } from '@ui/store.js';

export function useIdeIdName() {
  const { ide } = useSession();
  return ide ? getIntegration(ide).name : null;
}
