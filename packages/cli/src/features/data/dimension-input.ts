import { readFileSync } from 'node:fs';
import { requireRecord, requireString, resourcePath } from '@network/metrics-types.js';

function writableFields(value: unknown, fields: string[], label: string): Record<string, unknown> {
  const record = requireRecord(value, label);
  for (const field of Object.keys(record)) {
    if (!fields.includes(field))
      throw new Error(`Unknown or non-writable field ${label}.${field}.`);
  }
  return record;
}

function optionalString(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== 'string')
    throw new Error(`${label} must be a string.`);
}

function optionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== 'boolean')
    throw new Error(`${label} must be a boolean.`);
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}

function column(value: unknown, label: string): void {
  const record = writableFields(value, ['name', 'repeated'], label);
  requireString(record.name, `${label}.name`);
  optionalBoolean(record.repeated, `${label}.repeated`);
}

function duration(value: unknown, label: string): void {
  const text = requireString(value, label);
  const match = /^-?(0|[1-9]\d*)(?:\.\d{1,9})?s$/u.exec(text);
  // The protobuf range applies to the seconds component; nanos are checked by the pattern.
  if (match === null || Number(match[1]) > 315576000000) {
    throw new Error(`${label} must be a protobuf duration string, for example "86400s".`);
  }
}

function timestamp(value: unknown, label: string): void {
  const text = requireString(value, label);
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/u.exec(
      text,
    );
  if (match === null) throw new Error(`${label} must be an RFC 3339 timestamp.`);

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone] = match;
  const [year, month, day, hour, minute, second] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
  ].map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth =
    [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  const parsed = Date.parse(text);
  // Date.parse normalizes invalid dates such as February 30 and accepts 24:00:00.
  if (
    year < 1 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) ||
    !Number.isFinite(parsed) ||
    parsed < Date.parse('0001-01-01T00:00:00Z') ||
    parsed > Date.parse('9999-12-31T23:59:59.999Z')
  ) {
    throw new Error(`${label} must be an RFC 3339 timestamp within years 0001–9999.`);
  }
}

function updateStrategy(value: unknown): void {
  const label = 'DimensionTable.dataDeliveredUntilUpdateStrategyConfig';
  const record = writableFields(
    value,
    [
      'strategy',
      'disableEmptyPartitions',
      'automaticUpdateConfig',
      'dailyUpdateConfig',
      'hourlyUpdateConfig',
    ],
    label,
  );
  if (
    ![0, 1, 2, 'STRATEGY_UNSPECIFIED', 'MANUAL', 'AUTOMATIC'].includes(
      record.strategy as string | number,
    )
  ) {
    throw new Error(
      `${label}.strategy must be STRATEGY_UNSPECIFIED, MANUAL, or AUTOMATIC (or 0, 1, 2).`,
    );
  }
  optionalBoolean(record.disableEmptyPartitions, `${label}.disableEmptyPartitions`);
  const configs = ['automaticUpdateConfig', 'dailyUpdateConfig', 'hourlyUpdateConfig'];
  if (configs.filter((key) => record[key] !== undefined).length > 1) {
    throw new Error(`${label} accepts only one update config.`);
  }
  if (record.automaticUpdateConfig !== undefined) {
    const configLabel = `${label}.automaticUpdateConfig`;
    const config = writableFields(
      record.automaticUpdateConfig,
      ['incrementDuration', 'commitDelay', 'changeThreshold'],
      configLabel,
    );
    duration(config.commitDelay, `${configLabel}.commitDelay`);
    if (config.incrementDuration !== undefined)
      duration(config.incrementDuration, `${configLabel}.incrementDuration`);
    if (config.changeThreshold !== undefined) {
      const threshold = writableFields(
        config.changeThreshold,
        ['value'],
        `${configLabel}.changeThreshold`,
      );
      const value = threshold.value;
      optionalString(value, `${configLabel}.changeThreshold.value`);
      // Decimal's omitted or empty value represents zero; preserve it just like other defaults.
      if (
        typeof value === 'string' &&
        value !== '' &&
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(value)
      ) {
        throw new Error(`${configLabel}.changeThreshold.value must be a decimal string.`);
      }
    }
  }
  for (const key of ['dailyUpdateConfig', 'hourlyUpdateConfig']) {
    if (record[key] === undefined) continue;
    const config = writableFields(record[key], ['maxZeroDuration'], `${label}.${key}`);
    if (config.maxZeroDuration !== undefined)
      duration(config.maxZeroDuration, `${label}.${key}.maxZeroDuration`);
  }
}

/** Validate canonical proto JSON without normalizing keys or dropping any input fields. */
export function validateDimensionTable(value: unknown): Record<string, unknown> {
  const label = 'DimensionTable';
  const record = writableFields(
    value,
    [
      'sql',
      'displayName',
      'description',
      'entityColumnMapping',
      'timeConfig',
      'dimensions',
      'valueMappings',
      'dimensionDataDeliveredUntilTime',
      'dataDeliveredUntilUpdateStrategyConfig',
      'labels',
      'owner',
    ],
    label,
  );
  requireString(record.sql, `${label}.sql`);
  requireString(record.displayName, `${label}.displayName`);
  optionalString(record.description, `${label}.description`);
  optionalString(record.owner, `${label}.owner`);

  const mapping = writableFields(
    record.entityColumnMapping,
    ['column', 'entity'],
    `${label}.entityColumnMapping`,
  );
  column(mapping.column, `${label}.entityColumnMapping.column`);
  resourcePath(requireString(mapping.entity, `${label}.entityColumnMapping.entity`), 'entities');
  const dimensions = requireArray(record.dimensions, `${label}.dimensions`);
  if (dimensions.length === 0) throw new Error(`${label}.dimensions must not be empty.`);
  dimensions.forEach((value, index) => column(value, `${label}.dimensions[${index}]`));

  if (record.timeConfig !== undefined) {
    const config = writableFields(
      record.timeConfig,
      ['timestampColumn', 'window'],
      `${label}.timeConfig`,
    );
    column(config.timestampColumn, `${label}.timeConfig.timestampColumn`);
    duration(config.window, `${label}.timeConfig.window`);
  }
  if (record.valueMappings !== undefined) {
    requireArray(record.valueMappings, `${label}.valueMappings`).forEach((value, index) => {
      const mappingLabel = `${label}.valueMappings[${index}]`;
      const mapping = writableFields(value, ['column', 'mappings'], mappingLabel);
      requireString(mapping.column, `${mappingLabel}.column`);
      requireArray(mapping.mappings, `${mappingLabel}.mappings`).forEach((value, index) => {
        const valueLabel = `${mappingLabel}.mappings[${index}]`;
        const entry = writableFields(
          value,
          ['inputDimensionValue', 'outputDimensionValue'],
          valueLabel,
        );
        for (const key of ['inputDimensionValue', 'outputDimensionValue']) {
          // StringValue uses strings (or null for absence), not { value: ... } in proto JSON.
          if (entry[key] !== null) optionalString(entry[key], `${valueLabel}.${key}`);
        }
      });
    });
  }
  if (record.labels !== undefined) {
    for (const [key, value] of Object.entries(requireRecord(record.labels, `${label}.labels`))) {
      if (typeof value !== 'string') throw new Error(`${label}.labels.${key} must be a string.`);
    }
  }
  if (record.dimensionDataDeliveredUntilTime !== undefined) {
    timestamp(record.dimensionDataDeliveredUntilTime, `${label}.dimensionDataDeliveredUntilTime`);
  }
  if (record.dataDeliveredUntilUpdateStrategyConfig !== undefined)
    updateStrategy(record.dataDeliveredUntilUpdateStrategyConfig);
  return record;
}

export function readDimensionTable(file: unknown): Record<string, unknown> {
  const path = requireString(file, '--from-file');
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch (cause) {
    throw new Error(`Could not read file "${path}".`, { cause });
  }
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch (cause) {
    throw new Error(`Invalid JSON in "${path}".`, { cause });
  }
  return validateDimensionTable(value);
}

export function dimensionTablePath(value: unknown): string {
  const name = requireString(value, 'Dimension table name');
  return resourcePath(name.includes('/') ? name : `dimensionTables/${name}`, 'dimensionTables');
}

export function dimensionTableId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const id = requireString(value, '--id');
  resourcePath(`dimensionTables/${id}`, 'dimensionTables');
  return id;
}

export function dimensionTableListOptions(argv: Record<string, unknown>): {
  params: Record<string, string>;
  all: boolean;
} {
  const params: Record<string, string> = {};
  if (argv['page-size'] !== undefined) {
    const size = argv['page-size'];
    if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > 2147483647) {
      throw new Error('--page-size must be a positive 32-bit integer.');
    }
    params.pageSize = String(size);
  }
  for (const [flag, field] of [
    ['page-token', 'pageToken'],
    ['filter', 'filter'],
    ['order-by', 'orderBy'],
  ] as const) {
    if (argv[flag] !== undefined) params[field] = requireString(argv[flag], `--${flag}`);
  }
  optionalBoolean(argv['show-deleted'], '--show-deleted');
  if (argv['show-deleted'] !== undefined) params.showDeleted = String(argv['show-deleted']);
  optionalBoolean(argv.all, '--all');
  return { params, all: argv.all === true };
}
