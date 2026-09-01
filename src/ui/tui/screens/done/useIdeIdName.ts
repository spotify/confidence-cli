import { getIntegration } from '@integrations/index.js';
import { useSession } from '@ui/tui/store.js';

export function useIdeIdName() {
  const { ide } = useSession();
  return ide ? getIntegration(ide).name : null;
}
