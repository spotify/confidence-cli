import { createSession, navigateToOnboarding } from './testing-framework/index.js';

describe('Done screen migration hint', () => {
  it('shows /migrate-statsig hint when competitor is detected', async () => {
    using session = createSession({ project: 'react-statsig' });

    await navigateToOnboarding(session);
    await session.press('Enter');
    await session.waitForText('onboarding complete', { timeout: 30_000 });

    // Done
    await session.waitForText('Confidence is ready');
    await session.waitForText('/migrate-statsig');
    expect(session.snapshot()).toMatchSnapshot('done-with-migration-hint');
  });
});
