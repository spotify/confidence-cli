import { followInstruction } from '@spotify-confidence/core';
import { launchSkillChat } from '@features/ide/index.js';
import type { WarehouseType } from './types.js';
import { validateWarehouseType } from './utils.js';

const WAREHOUSE_SKILLS: Record<WarehouseType, string> = {
  bigquery: 'setup-warehouse-bigquery',
  snowflake: 'setup-warehouse-snowflake',
  databricks: 'setup-warehouse-databricks',
  redshift: 'setup-warehouse-redshift',
};

function buildSetupPrompt(warehouseType: WarehouseType): string {
  const skillRef = followInstruction(WAREHOUSE_SKILLS[warehouseType]);
  return `Set up a ${warehouseType} data warehouse for Confidence experimentation analytics.
${skillRef} step by step: collect configuration, validate, create the warehouse, set up connectors, and verify the pipeline.`;
}

export async function runWarehouseSetup(argv: Record<string, unknown>): Promise<void> {
  const warehouseType = validateWarehouseType(argv['warehouse-type'] as string);
  await launchSkillChat(argv, buildSetupPrompt(warehouseType));
}
