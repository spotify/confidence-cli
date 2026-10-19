import { readFileSync } from 'node:fs';
import { requireRecord, requireString, resourcePath } from '@network/metrics-types.js';

/** Input is the proto-JSON FactTable resource, not CLI options or a request wrapper. */
export function readFactTable(file: unknown): Record<string, unknown> {
  const path = requireString(file, '--from-file');
  let input: unknown;
  try {
    input = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read fact table JSON: ${(error as Error).message}`, { cause: error });
  }
  return validateFactTable(input);
}

function fields(
  input: unknown,
  allowed: readonly string[],
  label: string,
): Record<string, unknown> {
  const value = requireRecord(input, label);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${label}.${key} is unsupported or output-only.`);
  }
  return value;
}

function optionalString(value: Record<string, unknown>, key: string, label: string): void {
  if (value[key] !== undefined && typeof value[key] !== 'string') {
    throw new Error(`${label}.${key} must be a string.`);
  }
}

function optionalBoolean(value: Record<string, unknown>, key: string, label: string): void {
  if (value[key] !== undefined && typeof value[key] !== 'boolean') {
    throw new Error(`${label}.${key} must be a boolean.`);
  }
}

function column(input: unknown, label: string): void {
  const value = fields(input, ['name', 'repeated'], label);
  requireString(value.name, `${label}.name`);
  optionalBoolean(value, 'repeated', label);
}

function array(
  input: unknown,
  label: string,
  validate: (item: unknown, label: string) => void,
): void {
  if (!Array.isArray(input)) throw new Error(`${label} must be an array.`);
  input.forEach((item, index) => validate(item, `${label}[${index}]`));
}

function reference(input: unknown, collection: string, label: string): void {
  resourcePath(requireString(input, label), collection);
}

function oneof(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  if (keys.filter((key) => value[key] !== undefined).length > 1) {
    throw new Error(`${label} accepts at most one of ${keys.join(', ')}.`);
  }
}

function enumValue(input: unknown, allowed: readonly string[], label: string): void {
  if (typeof input !== 'string' || !allowed.includes(input)) {
    throw new Error(`${label} must be one of ${allowed.join(', ')}.`);
  }
}

const COLUMN_TYPES = [
  'COLUMN_TYPE_UNSPECIFIED',
  'COLUMN_TYPE_STRING',
  'COLUMN_TYPE_INT32',
  'COLUMN_TYPE_INT64',
  'COLUMN_TYPE_DOUBLE',
  'COLUMN_TYPE_BOOLEAN',
  'COLUMN_TYPE_DATE',
  'COLUMN_TYPE_TIMESTAMP',
  'COLUMN_TYPE_BYTES',
  'COLUMN_TYPE_TIMESTAMP_WITHOUT_TIMEZONE',
  'COLUMN_TYPE_DECIMAL',
  'COLUMN_TYPE_HLL_SKETCH',
];

function unit(input: unknown, label: string): void {
  const variants = ['baseUnit', 'currencyCode', 'customUnit', 'entity', 'factTable'];
  const value = fields(input, ['baseUnitMultiplier', ...variants], label);
  oneof(value, variants, label);
  if (
    value.baseUnitMultiplier !== undefined &&
    (typeof value.baseUnitMultiplier !== 'number' || !Number.isFinite(value.baseUnitMultiplier))
  ) {
    throw new Error(`${label}.baseUnitMultiplier must be a finite number.`);
  }
  if (value.baseUnit !== undefined) {
    enumValue(
      value.baseUnit,
      ['BASE_UNIT_UNSPECIFIED', 'NONE', 'PERCENT', 'SECOND', 'BYTE', 'BIT'],
      `${label}.baseUnit`,
    );
  }
  for (const key of ['currencyCode', 'customUnit']) {
    if (value[key] !== undefined) requireString(value[key], `${label}.${key}`);
  }
  if (value.entity !== undefined) reference(value.entity, 'entities', `${label}.entity`);
  if (value.factTable !== undefined) reference(value.factTable, 'factTables', `${label}.factTable`);
}

function measure(input: unknown, label: string): void {
  const value = fields(input, ['column', 'displayName', 'unit', 'declaredType'], label);
  column(value.column, `${label}.column`);
  optionalString(value, 'displayName', label);
  if (value.unit !== undefined) unit(value.unit, `${label}.unit`);
  if (value.declaredType !== undefined)
    enumValue(value.declaredType, COLUMN_TYPES, `${label}.declaredType`);
}

function duration(input: unknown, label: string): void {
  const value = requireString(input, label);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?s$/u.test(value) || Number.parseFloat(value) > 315576000000) {
    throw new Error(`${label} must be a non-negative protobuf duration, e.g. 3600s.`);
  }
}

function deliveryConfig(input: unknown, label: string): void {
  const variants = ['automaticUpdateConfig', 'dailyUpdateConfig', 'hourlyUpdateConfig'];
  const value = fields(input, ['strategy', 'disableEmptyPartitions', ...variants], label);
  enumValue(value.strategy, ['MANUAL', 'AUTOMATIC'], `${label}.strategy`);
  optionalBoolean(value, 'disableEmptyPartitions', label);
  oneof(value, variants, label);
  for (const key of variants) {
    if (value[key] === undefined) continue;
    const nestedLabel = `${label}.${key}`;
    if (key !== 'automaticUpdateConfig') {
      const nested = fields(value[key], ['maxZeroDuration'], nestedLabel);
      if (nested.maxZeroDuration !== undefined)
        duration(nested.maxZeroDuration, `${nestedLabel}.maxZeroDuration`);
      continue;
    }
    const nested = fields(
      value[key],
      ['commitDelay', 'incrementDuration', 'changeThreshold'],
      nestedLabel,
    );
    duration(nested.commitDelay, `${nestedLabel}.commitDelay`);
    if (nested.incrementDuration !== undefined)
      duration(nested.incrementDuration, `${nestedLabel}.incrementDuration`);
    if (nested.changeThreshold !== undefined) {
      const decimal = fields(nested.changeThreshold, ['value'], `${nestedLabel}.changeThreshold`);
      const text = requireString(decimal.value, `${nestedLabel}.changeThreshold.value`);
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(text)) {
        throw new Error(`${nestedLabel}.changeThreshold.value must be a decimal string.`);
      }
    }
  }
}

/** Validate without remapping or silently discarding any resource fields. */
export function validateFactTable(input: unknown): Record<string, unknown> {
  const object = requireRecord(input, 'Fact table');
  if ('skipSqlPreview' in object) {
    throw new Error(
      'skipSqlPreview is unsupported. Omit it and column.type; the service must validate SQL and infer column types.',
    );
  }
  const value = fields(
    object,
    [
      'sql',
      'displayName',
      'description',
      'timestampColumn',
      'entities',
      'measures',
      'dimensions',
      'factDataDeliveredUntilTime',
      'dataDeliveredUntilUpdateStrategyConfig',
      'labels',
      'owner',
    ],
    'Fact table',
  );
  requireString(value.sql, 'sql');
  requireString(value.displayName, 'displayName');
  column(value.timestampColumn, 'timestampColumn');
  array(value.entities, 'entities', (item, label) => {
    const mapping = fields(item, ['column', 'entity'], label);
    column(mapping.column, `${label}.column`);
    reference(mapping.entity, 'entities', `${label}.entity`);
  });
  if ((value.entities as unknown[]).length === 0)
    throw new Error('entities must contain at least one mapping.');
  optionalString(value, 'description', 'Fact table');
  if (value.measures !== undefined) array(value.measures, 'measures', measure);
  if (value.dimensions !== undefined) array(value.dimensions, 'dimensions', column);
  if (value.labels !== undefined) {
    const labels = requireRecord(value.labels, 'labels');
    for (const [key, label] of Object.entries(labels)) {
      if (typeof label !== 'string') throw new Error(`labels.${key} must be a string.`);
    }
  }
  if (value.owner !== undefined) reference(value.owner, 'identities', 'owner');
  if (value.factDataDeliveredUntilTime !== undefined) {
    const timestamp = requireString(value.factDataDeliveredUntilTime, 'factDataDeliveredUntilTime');
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u.test(
        timestamp,
      ) ||
      !Number.isFinite(Date.parse(timestamp))
    ) {
      throw new Error('factDataDeliveredUntilTime must be an RFC 3339 timestamp.');
    }
  }
  if (value.dataDeliveredUntilUpdateStrategyConfig !== undefined) {
    deliveryConfig(
      value.dataDeliveredUntilUpdateStrategyConfig,
      'dataDeliveredUntilUpdateStrategyConfig',
    );
  }
  return value;
}
