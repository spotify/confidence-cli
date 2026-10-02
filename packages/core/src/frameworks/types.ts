export type FrameworkId =
  'nextjs' | 'react' | 'swift' | 'kotlin' | 'java' | 'go' | 'python' | 'node';

export type FrameworkConfig = {
  id: FrameworkId;
  name: string;
  docsUrl: string;
  sdkPackage: string;
  detect: (dir: string) => Promise<boolean>;
};
