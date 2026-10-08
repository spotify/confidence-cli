const WAREHOUSE_TYPES = ['bigquery', 'snowflake', 'databricks', 'redshift'] as const;

export function validateWarehouseType(value: string): void {
  if (!(WAREHOUSE_TYPES as readonly string[]).includes(value)) {
    throw new Error(
      `Unknown warehouse type "${value}". Valid types: ${WAREHOUSE_TYPES.join(', ')}`,
    );
  }
}
