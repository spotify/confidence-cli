## {{STEP}}. Migrate {{PROVIDER_NAME}} flags to Confidence

Use the `/{{SKILL_NAME}}` skill to migrate existing {{PROVIDER_NAME}} feature flag evaluations to Confidence.

Follow the skill's three-phase workflow:

1. Run `/{{SKILL_NAME}} plan flag` to generate the flag migration plan
2. Run `/{{SKILL_NAME}} plan code` to generate the code migration plan
3. Run `/{{SKILL_NAME}} execute <plan-file>` to apply the migration

For each flag migrated, print:
STATUS: Migrated flag: <flag-name>

After all flags are migrated, check whether {{PROVIDER_NAME}} is used only for feature flags. If so, remove the {{PROVIDER_NAME}} SDK packages from the project's dependencies. If it is also used for other purposes (e.g. experimentation, remote config), only delete the code related to the migrated flags and keep the SDK installed.
Print: STATUS: Removed {{PROVIDER_NAME}} SDK (if fully removed) or STATUS: Cleaned up migrated flag code (if SDK retained)
