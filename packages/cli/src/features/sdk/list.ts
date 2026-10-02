import { getFrameworks } from '@spotify-confidence/core';

export type SdkListEntry = {
  name: string;
  package: string;
  docs: string;
};

export function listSdks(): SdkListEntry[] {
  const seen = new Set<string>();
  return getFrameworks().flatMap((fw) => {
    if (seen.has(fw.sdkPackage)) return [];
    seen.add(fw.sdkPackage);
    return [{ name: fw.name, package: fw.sdkPackage, docs: fw.docsUrl }];
  });
}
