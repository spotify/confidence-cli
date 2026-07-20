import {
  renderScreen,
  renderApp,
  createProjectDir,
  ENTER,
  ARROW_DOWN,
  ESCAPE,
  waitFor,
} from '../helpers/index.js';
import { SelectFrameworkScreen } from '@ui/tui/screens/select-framework/index.js';
import { ScreenId } from '@lib/session.js';

describe('SelectFrameworkScreen', () => {
  it('renders title', async () => {
    using sut = renderScreen(<SelectFrameworkScreen />, { screen: ScreenId.SelectFramework });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Select Framework');
    });
  });

  it('shows SDK options', async () => {
    using sut = renderScreen(<SelectFrameworkScreen />, { screen: ScreenId.SelectFramework });
    await waitFor(() => {
      expect(sut.lastFrame()).toContain('React');
      expect(sut.lastFrame()).toContain('TypeScript');
    });
  });

  it('shows current framework when already set', async () => {
    using project = createProjectDir();
    using sut = renderApp({ dir: project.path });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Currently');
      expect(sut.lastFrame()).toContain('react');
    });
  });

  it('sets framework on selection and navigates back', async () => {
    using sut = renderApp({ screen: ScreenId.SelectFramework });

    sut.stdin.write(ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
      expect(sut.lastFrame()).toContain('React');
    });
  });

  it('selects a different framework', async () => {
    using sut = renderApp({ screen: ScreenId.SelectFramework });

    sut.stdin.write(ARROW_DOWN + ENTER);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
    });
  });

  it('navigates back on Escape', async () => {
    using sut = renderApp({ screen: ScreenId.SelectFramework });

    sut.stdin.write(ESCAPE);

    await waitFor(() => {
      expect(sut.lastFrame()).toContain('Confidence Quickstart');
    });
  });
});
