export type FrameworkConfig = {
  id: string;
  name: string;
  docsUrl: string;
  sdkPackage: string;
  detect: (dir: string) => Promise<boolean>;
};
