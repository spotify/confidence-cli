import { http, HttpResponse, server } from '@spotify-confidence/testing';
import { buildTestJwt, prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { executeDataRequest } from '@features/data/index.js';
import { listEntities } from '@network/metrics-entities.js';
import { captureOutput } from '../helpers/capture.js';

const ENTITIES_URL = 'https://metrics.eu.confidence.dev/v1/entities';

describe('entity pagination safety limit', () => {
  it.each([{ entities: [] }, { entities: [{ name: 'entities/user_id' }] }])(
    'fails at the page limit for unique cursors without printing partial results: %j',
    async (page) => {
      // Arrange
      using _auth = prepareAuthTokens('valid');
      using output = captureOutput();
      let requests = 0;
      server.use(
        http.get(ENTITIES_URL, () => {
          requests++;
          return HttpResponse.json({
            ...page,
            nextPageToken: `cursor-${requests}`,
          });
        }),
      );
      const sut = () =>
        executeDataRequest({ json: true }, (token) =>
          listEntities(token, { all: true, maxPages: 3 }),
        );

      await sut();

      // Assert
      expect(requests).toBe(3);
      expect(output.stdout).toBe('');
      expect(output.stderr).toContain('Entities pagination exceeded the 3-page limit.');
      expect(process.exitCode).toBe(1);
    },
  );

  it('accepts a complete traversal that finishes exactly at the page limit', async () => {
    // Arrange
    let requests = 0;
    server.use(
      http.get(ENTITIES_URL, () => {
        requests++;
        return HttpResponse.json({
          entities: [{ name: `entities/page_${requests}` }],
          ...(requests < 3 ? { nextPageToken: `cursor-${requests}` } : {}),
        });
      }),
    );
    const sut = listEntities;

    const result = await sut(buildTestJwt(), { all: true, maxPages: 3 });

    // Assert
    expect(requests).toBe(3);
    expect(result).toEqual({
      ok: true,
      data: {
        entities: [
          { name: 'entities/page_1' },
          { name: 'entities/page_2' },
          { name: 'entities/page_3' },
        ],
        nextPageToken: '',
      },
    });
  });

  it('returns a single-page cursor without treating the page limit as completion', async () => {
    server.use(
      http.get(ENTITIES_URL, () => HttpResponse.json({ nextPageToken: 'remaining-pages' })),
    );
    const sut = listEntities;

    const result = await sut(buildTestJwt(), { maxPages: 1 });

    expect(result).toEqual({
      ok: true,
      data: { entities: [], nextPageToken: 'remaining-pages' },
    });
  });

  it.each([0, -1, 1.5, 1001, NaN, Infinity])(
    'rejects invalid or raised safety limit %s before making any request',
    async (maxPages) => {
      // Arrange
      let requests = 0;
      server.use(
        http.get(ENTITIES_URL, () => {
          requests++;
          return HttpResponse.json({});
        }),
      );
      const sut = listEntities;

      await expect(sut(buildTestJwt(), { all: true, maxPages })).rejects.toThrow(
        'Entities page limit must be an integer between 1 and 1000.',
      );

      expect(requests).toBe(0);
    },
  );
});
