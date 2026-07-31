import { detectProviders } from '@providers/index.js';
import { createProjectDir } from '../shared/project-scaffold/index.js';

describe('detectProviders', () => {
  describe('when project has no manifest files', () => {
    it('returns empty array for empty directory', () => {
      using project = createProjectDir('empty');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([]);
    });
  });

  describe('when project has npm dependencies', () => {
    it('detects Eppo SDK', () => {
      using project = createProjectDir('react-eppo');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'eppo', name: 'Eppo', skillName: 'migrate-eppo' }]);
    });

    it('detects Optimizely SDK', () => {
      using project = createProjectDir('optimizely');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([
        { id: 'optimizely', name: 'Optimizely', skillName: 'migrate-optimizely' },
      ]);
    });

    it('detects PostHog SDK', () => {
      using project = createProjectDir('posthog');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'posthog', name: 'PostHog', skillName: 'migrate-posthog' }]);
    });

    it('detects Statsig SDK', () => {
      using project = createProjectDir('statsig');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });

    it('detects multiple providers', () => {
      using project = createProjectDir('react-posthog-statsig');

      const sut = detectProviders(project.path);

      expect(sut).toHaveLength(2);
      expect(sut.map((c) => c.id)).toEqual(['posthog', 'statsig']);
    });

    it('detects provider in devDependencies', () => {
      using project = createProjectDir('statsig-node');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });

    it('returns empty array when no providers found', () => {
      using project = createProjectDir('nextjs');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([]);
    });
  });

  describe('when project has Python dependencies', () => {
    it('detects provider from requirements.txt', () => {
      using project = createProjectDir('python-posthog');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'posthog', name: 'PostHog', skillName: 'migrate-posthog' }]);
    });

    it('detects provider from pyproject.toml', () => {
      using project = createProjectDir('python-statsig');
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });
  });
});
