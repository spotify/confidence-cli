export type WarehouseType = 'bigquery' | 'snowflake' | 'databricks' | 'redshift';

export type WarehouseTypeParams = {
  'warehouse-type': string;
  'config-json': string;
};
