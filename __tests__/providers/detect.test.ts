import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectProviders } from '@providers/index.js';
import { createProjectDir } from '../ui/helpers/project.js';

describe('detectProviders', () => {
  describe('when project has no manifest files', () => {
    it('returns empty array for empty directory', () => {
      using project = createProjectDir(null);
      const sut = detectProviders(project.path);
      expect(sut).toEqual([]);
    });
  });

  describe('when project has npm dependencies', () => {
    it('detects Eppo SDK', () => {
      using project = createProjectDir({ '@eppo/js-client-sdk': '^1.0.0', react: '^19.0.0' });
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'eppo', name: 'Eppo', skillName: 'migrate-eppo' }]);
    });

    it('detects Optimizely SDK', () => {
      using project = createProjectDir({ '@optimizely/optimizely-sdk': '^5.0.0' });
      const sut = detectProviders(project.path);
      expect(sut).toEqual([
        { id: 'optimizely', name: 'Optimizely', skillName: 'migrate-optimizely' },
      ]);
    });

    it('detects PostHog SDK', () => {
      using project = createProjectDir({ 'posthog-js': '^1.0.0' });
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'posthog', name: 'PostHog', skillName: 'migrate-posthog' }]);
    });

    it('detects Statsig SDK', () => {
      using project = createProjectDir({ '@statsig/js-client': '^1.0.0' });
      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });

    it('detects multiple providers', () => {
      using project = createProjectDir({
        'posthog-js': '^1.0.0',
        '@statsig/react-sdk': '^2.0.0',
        react: '^19.0.0',
      });

      const sut = detectProviders(project.path);

      expect(sut).toHaveLength(2);
      expect(sut.map((c) => c.id)).toEqual(['posthog', 'statsig']);
    });

    it('detects provider in devDependencies', () => {
      using project = createProjectDir(null);
      writeFileSync(
        join(project.path, 'package.json'),
        JSON.stringify({ devDependencies: { 'statsig-node': '^1.0.0' } }),
      );

      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });

    it('returns empty array when no providers found', () => {
      using project = createProjectDir({ react: '^19.0.0', next: '^15.0.0' });
      const sut = detectProviders(project.path);
      expect(sut).toEqual([]);
    });
  });

  describe('when project has Python dependencies', () => {
    it('detects provider from requirements.txt', () => {
      using project = createProjectDir(null);
      writeFileSync(join(project.path, 'requirements.txt'), 'posthog>=3.0.0\nflask==2.0.0\n');

      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'posthog', name: 'PostHog', skillName: 'migrate-posthog' }]);
    });

    it('detects provider from pyproject.toml', () => {
      using project = createProjectDir(null);
      writeFileSync(
        join(project.path, 'pyproject.toml'),
        `[project]\nname = "myapp"\ndependencies = [\n  "statsig>=1.0.0",\n  "flask"\n]\n`,
      );

      const sut = detectProviders(project.path);
      expect(sut).toEqual([{ id: 'statsig', name: 'Statsig', skillName: 'migrate-statsig' }]);
    });
  });
});
