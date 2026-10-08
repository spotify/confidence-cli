import { mcpCallTool, type CallToolResult } from '@spotify-confidence/core';
import { serverOpts } from './config.js';

export async function validateWarehouseConfig(
  token: string,
  warehouseType: string,
  configJson: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'validateWarehouseConfig', {
    warehouseType,
    configJson,
  });
}

export async function createWarehouse(
  token: string,
  warehouseType: string,
  configJson: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createWarehouse', {
    warehouseType,
    configJson,
  });
}

export async function createFlagAppliedConnection(
  token: string,
  warehouseType: string,
  configJson: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createFlagAppliedConnection', {
    warehouseType,
    configJson,
  });
}

export async function createEventConnection(
  token: string,
  warehouseType: string,
  configJson: string,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createEventConnection', {
    warehouseType,
    configJson,
  });
}

type CreateAssignmentTableParams = {
  displayName: string;
  sql: string;
  entityColumn: string;
  timestampColumn: string;
  exposureKeyColumn: string;
  variantKeyColumn: string;
};

export async function createAssignmentTable(
  token: string,
  params: CreateAssignmentTableParams,
): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createAssignmentTable', params);
}

export async function createCryptoKey(token: string, cryptoKeyId: string): Promise<CallToolResult> {
  return mcpCallTool(serverOpts(token), 'createCryptoKey', { cryptoKeyId });
}
