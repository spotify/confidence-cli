import { launchSkillChat } from '@features/ide/index.js';

const SDK_SETUP_PROMPT = `Set up the Confidence SDK in this project.
Detect the project's framework, then use the getCodeSnippetAndSdkIntegrationTips tool from the confidence-docs MCP server to get the integration guide for that SDK.
Install the SDK package and create a working configuration file following the guide.
Only set up the SDK — do not create feature flags, event tracking, or session recordings.`;

export async function runSdkSetup(argv: Record<string, unknown>): Promise<void> {
  await launchSkillChat(argv, SDK_SETUP_PROMPT);
}
