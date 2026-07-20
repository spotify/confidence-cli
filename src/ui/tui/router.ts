import { ScreenId } from '@lib/session.js';
import { $session, store } from './store.js';

export type NavDirection = 'forward' | 'back';
export type TransitionMap = Record<ScreenId, Record<string, ScreenId>>;

export class WizardRouter {
  private transitions: TransitionMap;
  private history: ScreenId[] = [];
  private _lastNavDirection: NavDirection = 'forward';

  get lastNavDirection(): NavDirection {
    return this._lastNavDirection;
  }

  constructor(transitions: TransitionMap) {
    this.transitions = transitions;
  }

  to(event: string): void {
    const current = $session.get().currentScreen;
    const target = this.transitions[current]?.[event];
    if (!target) return;

    store.completeScreen(current);
    this.history.push(current);
    store.navigateTo(target);
    this._lastNavDirection = 'forward';
  }

  back(): void {
    const prev = this.history.pop() ?? ScreenId.Welcome;
    store.navigateTo(prev);
    this._lastNavDirection = 'back';
  }
}
