import { writeFileSync } from 'node:fs';
import { createProjectDir, writeJsonFile } from '@spotify-confidence/testing/scaffold';
import { readFactTable, validateFactTable } from '@features/data/fact-input.js';

function resource() {
  return {
    sql: 'SELECT happened_at, user_id, amount FROM purchases',
    displayName: 'Purchases',
    timestampColumn: { name: 'happened_at' },
    entities: [{ column: { name: 'user_id' }, entity: 'entities/user' }],
  };
}

describe('fact table resource input', () => {
  it('reads camelCase resource keys without normalizing or dropping mappings', () => {
    using project = createProjectDir('empty');
    const input = {
      ...resource(),
      description: 'Orders placed',
      measures: [
        {
          column: { name: 'amount' },
          displayName: 'Revenue',
          declaredType: 'COLUMN_TYPE_DECIMAL',
          unit: { currencyCode: 'USD', baseUnitMultiplier: 1 },
        },
      ],
      dimensions: [{ name: 'product', repeated: true }],
      labels: { costCenter: 'growth', state: 'custom label', unknownKey: 'allowed map key' },
      owner: 'identities/owner',
      factDataDeliveredUntilTime: '2026-05-01T00:00:00Z',
      dataDeliveredUntilUpdateStrategyConfig: {
        strategy: 'AUTOMATIC',
        dailyUpdateConfig: { maxZeroDuration: '86400s' },
        disableEmptyPartitions: true,
      },
    };
    const file = writeJsonFile(project.path, 'fact.json', input);
    const sut = readFactTable;

    const actual = sut(file);

    expect(actual).toEqual(input);
  });

  it.each([
    { strategy: 'MANUAL' },
    {
      strategy: 'AUTOMATIC',
      automaticUpdateConfig: {
        commitDelay: '3600s',
        incrementDuration: '60s',
        changeThreshold: { value: '0.01' },
      },
    },
    { strategy: 'AUTOMATIC', hourlyUpdateConfig: {} },
  ])('preserves supported delivery strategy %j', (config) => {
    const input = { ...resource(), dataDeliveredUntilUpdateStrategyConfig: config };
    const sut = validateFactTable;
    expect(sut(input)).toEqual(input);
  });

  it.each([
    { baseUnit: 'SECOND', baseUnitMultiplier: 0.001 },
    { currencyCode: 'EUR' },
    { customUnit: 'Click' },
    { entity: 'entities/user' },
    { factTable: 'factTables/purchases' },
  ])('preserves supported measure unit %j', (unit) => {
    const input = { ...resource(), measures: [{ column: { name: 'amount' }, unit }] };
    const sut = validateFactTable;
    expect(sut(input)).toEqual(input);
  });

  it.each<[string, unknown]>([
    ['timestampColumn', { ...resource(), timestampColumn: { name: 'ts', extra: true } }],
    [
      'entities[0]',
      {
        ...resource(),
        entities: [{ column: { name: 'user_id' }, entity: 'entities/user', extra: true }],
      },
    ],
    [
      'entities[0].column',
      {
        ...resource(),
        entities: [{ column: { name: 'user_id', extra: true }, entity: 'entities/user' }],
      },
    ],
    ['measures[0]', { ...resource(), measures: [{ column: { name: 'amount' }, extra: true }] }],
    [
      'measures[0].column',
      { ...resource(), measures: [{ column: { name: 'amount', extra: true } }] },
    ],
    [
      'measures[0].unit',
      { ...resource(), measures: [{ column: { name: 'amount' }, unit: { extra: true } }] },
    ],
    ['dimensions[0]', { ...resource(), dimensions: [{ name: 'country', extra: true }] }],
    [
      'dataDeliveredUntilUpdateStrategyConfig',
      {
        ...resource(),
        dataDeliveredUntilUpdateStrategyConfig: { strategy: 'MANUAL', extra: true },
      },
    ],
    ...['automaticUpdateConfig', 'dailyUpdateConfig', 'hourlyUpdateConfig'].map(
      (key): [string, unknown] => [
        `dataDeliveredUntilUpdateStrategyConfig.${key}`,
        {
          ...resource(),
          dataDeliveredUntilUpdateStrategyConfig: {
            strategy: 'AUTOMATIC',
            [key]: { extra: true },
          },
        },
      ],
    ),
    [
      'dataDeliveredUntilUpdateStrategyConfig.automaticUpdateConfig.changeThreshold',
      {
        ...resource(),
        dataDeliveredUntilUpdateStrategyConfig: {
          strategy: 'AUTOMATIC',
          automaticUpdateConfig: {
            commitDelay: '3600s',
            changeThreshold: { value: '0.01', extra: true },
          },
        },
      },
    ],
  ])('rejects unknown fields in %s', (label, input) => {
    const sut = validateFactTable;
    expect(() => sut(input)).toThrow(`${label}.extra is unsupported or output-only`);
  });

  it.each([
    { timestampColumn: { name: 'ts', type: 'COLUMN_TYPE_TIMESTAMP' } },
    {
      entities: [
        { column: { name: 'user_id', type: 'COLUMN_TYPE_STRING' }, entity: 'entities/user' },
      ],
    },
    { measures: [{ column: { name: 'amount', type: 'COLUMN_TYPE_DOUBLE' } }] },
    { dimensions: [{ name: 'country', type: 'COLUMN_TYPE_STRING' }] },
  ])('rejects output-only column types in every column location: %j', (mapping) => {
    const sut = validateFactTable;
    expect(() => sut({ ...resource(), ...mapping })).toThrow('type is unsupported or output-only');
  });

  it.each([
    ['null', null, 'must be an object'],
    ['array', [], 'must be an object'],
    ['wrapper', { factTable: resource() }, 'factTable'],
    ['missing SQL', { ...resource(), sql: ' ' }, 'sql'],
    ['missing displayName', { ...resource(), displayName: undefined }, 'displayName'],
    [
      'invalid timestamp mapping',
      { ...resource(), timestampColumn: 'happened_at' },
      'timestampColumn',
    ],
    ['missing entities', { ...resource(), entities: undefined }, 'entities'],
    ['empty entities', { ...resource(), entities: [] }, 'at least one'],
    [
      'invalid entity mapping',
      { ...resource(), entities: [{ column: 'user_id', entity: 'entities/user' }] },
      'column',
    ],
    [
      'missing entity reference',
      { ...resource(), entities: [{ column: { name: 'user_id' } }] },
      'entity',
    ],
    [
      'unsafe entity reference',
      { ...resource(), entities: [{ column: { name: 'user_id' }, entity: 'entities/../user' }] },
      'Resource name',
    ],
    ['unknown field', { ...resource(), display_name: 'Other' }, 'display_name'],
    ['invalid labels', { ...resource(), labels: { team: 5 } }, 'labels.team'],
    ['invalid owner', { ...resource(), owner: 'owner' }, 'Resource name'],
    ['invalid timestamp', { ...resource(), factDataDeliveredUntilTime: 'yesterday' }, 'timestamp'],
    ['invalid dimensions', { ...resource(), dimensions: ['product'] }, 'dimensions[0]'],
    [
      'column annotations',
      { ...resource(), dimensions: [{ name: 'product', annotations: {} }] },
      'annotations',
    ],
    [
      'column type',
      { ...resource(), timestampColumn: { name: 'happened_at', type: 'COLUMN_TYPE_TIMESTAMP' } },
      'type',
    ],
    [
      'invalid repeated',
      { ...resource(), timestampColumn: { name: 'happened_at', repeated: 'yes' } },
      'boolean',
    ],
    ['invalid measure mapping', { ...resource(), measures: [{ name: 'amount' }] }, 'name'],
    [
      'unknown measure field',
      { ...resource(), measures: [{ column: { name: 'amount' }, expression: 'SUM(amount)' }] },
      'expression',
    ],
    [
      'unknown declared type',
      { ...resource(), measures: [{ column: { name: 'amount' }, declaredType: 'money' }] },
      'declaredType',
    ],
    [
      'invalid unit oneof',
      {
        ...resource(),
        measures: [
          { column: { name: 'amount' }, unit: { currencyCode: 'USD', customUnit: 'dollar' } },
        ],
      },
      'at most one',
    ],
    [
      'unknown unit field',
      { ...resource(), measures: [{ column: { name: 'amount' }, unit: { currency: 'USD' } }] },
      'currency',
    ],
    [
      'invalid strategy',
      { ...resource(), dataDeliveredUntilUpdateStrategyConfig: { strategy: 'eventually' } },
      'strategy',
    ],
    [
      'missing commit delay',
      {
        ...resource(),
        dataDeliveredUntilUpdateStrategyConfig: {
          strategy: 'AUTOMATIC',
          automaticUpdateConfig: {},
        },
      },
      'commitDelay',
    ],
    [
      'invalid duration',
      {
        ...resource(),
        dataDeliveredUntilUpdateStrategyConfig: {
          strategy: 'AUTOMATIC',
          hourlyUpdateConfig: { maxZeroDuration: '1 hour' },
        },
      },
      'duration',
    ],
    [
      'invalid config oneof',
      {
        ...resource(),
        dataDeliveredUntilUpdateStrategyConfig: {
          strategy: 'AUTOMATIC',
          hourlyUpdateConfig: {},
          dailyUpdateConfig: {},
        },
      },
      'at most one',
    ],
  ])('rejects %s rather than silently dropping input', (_label, input, error) => {
    const sut = validateFactTable;
    expect(() => sut(input)).toThrow(error);
  });

  it.each([
    'name',
    'state',
    'error',
    'schemaValidationJob',
    'createTime',
    'updateTime',
    'deleteTime',
    'creator',
    'updater',
    'systemCreated',
    'partitionedUpdateStrategyState',
  ])('rejects server-managed %s', (field) => {
    const sut = validateFactTable;
    expect(() => sut({ ...resource(), [field]: 'server value' })).toThrow(
      `${field} is unsupported or output-only`,
    );
  });

  it.each([true, false])('explicitly rejects skipSqlPreview=%s', (skipSqlPreview) => {
    const sut = validateFactTable;
    expect(() => sut({ ...resource(), skipSqlPreview })).toThrow('skipSqlPreview is unsupported');
  });

  it('reports unreadable files', () => {
    using project = createProjectDir('empty');
    const sut = readFactTable;
    expect(() => sut(`${project.path}/missing.json`)).toThrow('Cannot read fact table JSON');
  });

  it('reports malformed JSON', () => {
    using project = createProjectDir('empty');
    const path = `${project.path}/broken.json`;
    writeFileSync(path, '{broken');
    const sut = readFactTable;

    expect(() => sut(path)).toThrow('Cannot read fact table JSON');
  });
});
