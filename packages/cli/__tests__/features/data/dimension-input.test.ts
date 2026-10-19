import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { readDimensionTable as sut } from '@features/data/dimension-input.js';

const valid = {
  sql: 'SELECT id, country FROM users',
  displayName: 'User dimensions',
  entityColumnMapping: { column: { name: 'id' }, entity: 'entities/user' },
  dimensions: [{ name: 'country' }],
};

function readResource(body: unknown): Record<string, unknown> {
  using project = createProjectDir('empty');
  return sut(writeJsonFile(project.path, 'dimension.json', body));
}

describe('dimension table resource JSON input', () => {
  it('reads canonical camelCase resource fields without converting them to CLI options', () => {
    using project = createProjectDir('empty');
    const file = writeJsonFile(project.path, 'dimension.json', valid);

    const result = sut(file);

    expect(result).toEqual(valid);
    expect(result).not.toHaveProperty('display-name');
    expect(result).not.toHaveProperty('entity-column-mapping');
  });

  it.each([
    { description: '', owner: 'identities/owner', labels: { team: 'growth', empty: '' } },
    { description: '', owner: '', labels: {} },
    {
      dimensions: [{ name: 'countries', repeated: true }],
      entityColumnMapping: { column: { name: 'id', repeated: false }, entity: 'entities/user' },
    },
    {
      timeConfig: {
        timestampColumn: { name: 'time', repeated: false },
        window: '86400.123456789s',
      },
    },
    {
      valueMappings: [
        {
          column: 'country',
          mappings: [
            { inputDimensionValue: 'SE', outputDimensionValue: 'Sweden' },
            { outputDimensionValue: 'Unknown' },
            { inputDimensionValue: null, outputDimensionValue: null },
            { inputDimensionValue: '', outputDimensionValue: '' },
            {},
          ],
        },
      ],
    },
    { valueMappings: [] },
    { dimensionDataDeliveredUntilTime: '2026-01-01T12:30:00.123456789Z' },
    { dimensionDataDeliveredUntilTime: '2024-02-29T23:59:59.999999999+02:30' },
    { dimensionDataDeliveredUntilTime: '2000-02-29T00:00:00-01:00' },
    { dimensionDataDeliveredUntilTime: '0001-01-01T00:00:00Z' },
    { dimensionDataDeliveredUntilTime: '9999-12-31T23:59:59.999999999Z' },
    { dataDeliveredUntilUpdateStrategyConfig: { strategy: 0 } },
    { dataDeliveredUntilUpdateStrategyConfig: { strategy: 'STRATEGY_UNSPECIFIED' } },
    {
      dataDeliveredUntilUpdateStrategyConfig: { strategy: 'MANUAL', disableEmptyPartitions: false },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: {
          commitDelay: '300s',
          incrementDuration: '3600s',
          changeThreshold: { value: '0.01' },
        },
      },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 2,
        dailyUpdateConfig: { maxZeroDuration: '86400s' },
      },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        hourlyUpdateConfig: { maxZeroDuration: '3600s' },
      },
    },
    { dataDeliveredUntilUpdateStrategyConfig: { strategy: 1, dailyUpdateConfig: {} } },
    ...[{}, { value: '' }, { value: '0' }, { value: '-1.2e+3' }].map((changeThreshold) => ({
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: { commitDelay: '0s', changeThreshold },
      },
    })),
    ...['315576000000.999999999s', '-315576000000.999999999s', '-0.000000001s'].map((window) => ({
      timeConfig: { timestampColumn: { name: 'time' }, window },
    })),
  ])('preserves supported optional fields unchanged: %j', (fields) => {
    const body = { ...valid, ...fields };

    const result = readResource(body);

    expect(result).toEqual(body);
  });

  it.each(['sql', 'displayName', 'entityColumnMapping', 'dimensions'])(
    'rejects missing required %s',
    (field) => {
      const body: Record<string, unknown> = { ...valid };
      delete body[field];

      expect(() => readResource(body)).toThrow(field);
    },
  );

  it.each([null, [], 'text', 42, true])('rejects a non-object resource %j', (body) => {
    expect(() => readResource(body)).toThrow('DimensionTable must be an object');
  });

  it.each([
    ['sql', ''],
    ['sql', '  '],
    ['sql', 42],
    ['displayName', null],
    ['displayName', ''],
    ['description', false],
    ['owner', {}],
    ['labels', []],
    ['labels', null],
    ['labels', { team: 42 }],
    ['dimensions', []],
    ['dimensions', 'country'],
    ['dimensions', ['country']],
    ['dimensions', [null]],
    ['dimensions', [{ name: '' }]],
    ['dimensions', [{ name: 'country', repeated: 'true' }]],
    ['entityColumnMapping', {}],
    ['entityColumnMapping', []],
    ['entityColumnMapping', { column: 'id', entity: 'entities/user' }],
    ['entityColumnMapping', { column: { name: 'id' } }],
    ['entityColumnMapping', { column: { name: 'id' }, entity: 'user' }],
    ['entityColumnMapping', { column: { name: 'id' }, entity: 'entities/a/b' }],
    ['entityColumnMapping', { column: { name: 'id' }, entity: 'entities/../user' }],
    ['entityColumnMapping', { column: { name: 'id' }, entity: 'entities/%2Fuser' }],
    ['entityColumnMapping', { column: { name: 'id' }, entity: 'entities/user?other=value' }],
    ['timeConfig', null],
    ['timeConfig', {}],
    ['timeConfig', { timestampColumn: 'time', window: '3600s' }],
    ['timeConfig', { timestampColumn: { name: 'time' } }],
    ['timeConfig', { timestampColumn: { name: 'time' }, window: { seconds: 3600 } }],
    ['timeConfig', { timestampColumn: { name: 'time' }, window: '1h' }],
    ['timeConfig', { timestampColumn: { name: 'time' }, window: '1.1234567890s' }],
    ['timeConfig', { timestampColumn: { name: 'time' }, window: '315576000001s' }],
    ['valueMappings', null],
    ['valueMappings', {}],
    ['valueMappings', [null]],
    ['valueMappings', [{ column: 'country' }]],
    ['valueMappings', [{ column: '', mappings: [] }]],
    ['valueMappings', [{ column: 'country', mappings: {} }]],
    ['valueMappings', [{ column: 'country', mappings: [null] }]],
    ['valueMappings', [{ column: 'country', mappings: [{ inputDimensionValue: 1 }] }]],
    ['valueMappings', [{ column: 'country', mappings: [{ outputDimensionValue: false }] }]],
    [
      'valueMappings',
      [{ column: 'country', mappings: [{ inputDimensionValue: { value: 'SE' } }] }],
    ],
    ['dimensionDataDeliveredUntilTime', 42],
    ['dimensionDataDeliveredUntilTime', 'not-a-time'],
    ...[
      '2026-02-29T00:00:00Z',
      '2026-02-30T00:00:00Z',
      '1900-02-29T00:00:00Z',
      '2026-04-31T00:00:00Z',
      '2026-00-01T00:00:00Z',
      '2026-13-01T00:00:00Z',
      '2026-01-00T00:00:00Z',
      '2026-01-01T24:00:00Z',
      '2026-01-01T00:60:00Z',
      '2026-01-01T00:00:60Z',
      '2026-01-01T00:00:00+24:00',
      '2026-01-01T00:00:00+00:60',
      '2026-01-01T00:00:00.1234567890Z',
      '0000-01-01T00:00:00Z',
      '0001-01-01T00:00:00+00:01',
      '9999-12-31T23:59:59-00:01',
    ].map((value): [string, unknown] => ['dimensionDataDeliveredUntilTime', value]),
    ['dataDeliveredUntilUpdateStrategyConfig', null],
    ['dataDeliveredUntilUpdateStrategyConfig', {}],
    ['dataDeliveredUntilUpdateStrategyConfig', { strategy: 'invented' }],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      { strategy: 'AUTOMATIC', disableEmptyPartitions: 'true' },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      { strategy: 'AUTOMATIC', automaticUpdateConfig: {} },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      { strategy: 'AUTOMATIC', automaticUpdateConfig: { commitDelay: 300 } },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: { commitDelay: '300s', changeThreshold: '0.01' },
      },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: { commitDelay: '300s', changeThreshold: { value: 'NaN' } },
      },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      { strategy: 'AUTOMATIC', dailyUpdateConfig: [], hourlyUpdateConfig: {} },
    ],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      { strategy: 'AUTOMATIC', dailyUpdateConfig: { maxZeroDuration: 60 } },
    ],
  ])('rejects invalid known field %s: %j', (field, value) => {
    expect(() => readResource({ ...valid, [field as string]: value })).toThrow();
  });

  it.each([
    'name',
    'state',
    'error',
    'schemaValidationJob',
    'partitionedUpdateStrategyState',
    'creator',
    'updater',
    'createTime',
    'updateTime',
    'deleteTime',
    'systemCreated',
    'unknown',
    'display-name',
    'display_name',
    'dimensionTable',
    'dimensionTableId',
  ])('rejects non-writable or unknown root field %s instead of silently discarding it', (field) => {
    expect(() => readResource({ ...valid, [field]: 'unexpected' })).toThrow(
      `DimensionTable.${field}`,
    );
  });

  it('rejects a request wrapper instead of reading a nested resource', () => {
    expect(() => readResource({ dimensionTable: valid })).toThrow('DimensionTable.dimensionTable');
  });

  it.each([
    { dimensions: [{ name: 'country', type: 'STRING' }] },
    { dimensions: [{ name: 'country', annotations: {} }] },
    { entityColumnMapping: { column: { name: 'id', type: 'STRING' }, entity: 'entities/user' } },
    { entityColumnMapping: { column: { name: 'id' }, entity: 'entities/user', other: true } },
    { timeConfig: { timestampColumn: { name: 'time', annotations: [] }, window: '86400s' } },
    { timeConfig: { timestampColumn: { name: 'time' }, window: '86400s', extra: true } },
    { valueMappings: [{ column: 'country', mappings: [], extra: true }] },
    { valueMappings: [{ column: 'country', mappings: [{ value: 'SE' }] }] },
    { dataDeliveredUntilUpdateStrategyConfig: { strategy: 'MANUAL', unknown: true } },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: { commitDelay: '300s', unknown: true },
      },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        hourlyUpdateConfig: { unknown: true },
      },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        dailyUpdateConfig: { unknown: 1 },
      },
    },
    {
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        automaticUpdateConfig: {
          commitDelay: '300s',
          changeThreshold: { value: '0.1', unknown: 1 },
        },
      },
    },
  ])('rejects unknown or non-writable nested fields: %j', (fields) => {
    expect(() => readResource({ ...valid, ...fields })).toThrow('Unknown or non-writable field');
  });

  it('reports an unreadable file', () => {
    using project = createProjectDir('empty');
    expect(() => sut(join(project.path, 'missing.json'))).toThrow('Could not read file');
  });

  it('reports malformed JSON', () => {
    using project = createProjectDir('empty');
    const file = join(project.path, 'broken.json');
    writeFileSync(file, '{');

    expect(() => sut(file)).toThrow('Invalid JSON');
  });

  it.each([undefined, null, 123, ''])('requires a file path: %j', (path) => {
    expect(() => sut(path)).toThrow('--from-file must be a non-empty string');
  });
});
