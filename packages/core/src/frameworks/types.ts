export type FrameworkId =
  'react' | 'nextjs' | 'node' | 'python' | 'go' | 'kotlin' | 'java' | 'swift';

export type FrameworkConfig = {
  id: FrameworkId;
  name: string;
  docsUrl: string;
  sdkPackage: string;
  detect: (dir: string) => Promise<boolean>;
};
