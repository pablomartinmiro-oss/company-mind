// src/mastra/index.ts
// Main Mastra instance — registers all agents, tools, and workflows

import { Mastra } from '@mastra/core';
import { companyMindAgent } from './agents/company-mind';

export const mastra = new Mastra({
  agents: { companyMind: companyMindAgent },
});
