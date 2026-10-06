type AutoInstall = { type: 'auto'; cmd: string; args: string[] };
type ManualInstall = { type: 'manual'; snippet: string };

export type InstallCommand = AutoInstall | ManualInstall;
