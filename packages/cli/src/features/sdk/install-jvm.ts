import type { InstallCommand } from './install-types.js';

export function buildKotlinInstall(pkg: string): InstallCommand {
  return {
    type: 'manual',
    snippet:
      `Add the following to your app/build.gradle.kts:\n\n` +
      `  dependencies {\n` +
      `      implementation("${pkg}:<version>")\n` +
      `  }`,
  };
}

export function buildJavaInstall(pkg: string): InstallCommand {
  return {
    type: 'manual',
    snippet:
      `Add the following to your build.gradle.kts or pom.xml:\n\n` +
      `  Gradle:\n` +
      `      implementation("${pkg}:<version>")\n\n` +
      `  Maven:\n` +
      `      <dependency>\n` +
      `          <groupId>com.spotify.confidence</groupId>\n` +
      `          <artifactId>openfeature-provider</artifactId>\n` +
      `          <version>VERSION</version>\n` +
      `      </dependency>`,
  };
}
