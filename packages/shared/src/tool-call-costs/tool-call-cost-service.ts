import {
  dbGetToolCallCostByName,
  dbGetToolCallCosts,
  dbUpdateToolCallCost,
} from '@shared/db/functions/tool-call';
import { type ToolCallName } from '@shared/db/schema';
import {
  toolCallCostSchema,
  type ToolCallCost,
  updateToolCallCostSchema,
  type UpdateToolCallCostInput,
} from './tool-call-cost';

export async function getToolCallCosts(): Promise<ToolCallCost[]> {
  const toolCallCosts = await dbGetToolCallCosts();

  return toolCallCostSchema.array().parse(toolCallCosts);
}

export async function getToolCallCostByName(toolCallName: ToolCallName): Promise<ToolCallCost> {
  const toolCallCost = await dbGetToolCallCostByName(toolCallName);

  return toolCallCostSchema.parse(toolCallCost);
}

export async function updateToolCallCost(input: UpdateToolCallCostInput): Promise<ToolCallCost> {
  const values = updateToolCallCostSchema.parse(input);
  const updatedToolCallCost = await dbUpdateToolCallCost(values);

  return toolCallCostSchema.parse(updatedToolCallCost);
}
