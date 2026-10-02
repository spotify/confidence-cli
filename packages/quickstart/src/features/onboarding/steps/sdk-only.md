Install the appropriate Confidence SDK into the {{FRAMEWORK}} project at {{PROJECT_DIR}}.
Follow these steps in order, printing a short status line before each one.

## 1. Preflight

Print "STATUS: Looking up SDK for {{FRAMEWORK}}..."

Call {{DOCS_searchDocumentation}} with query "{{FRAMEWORK}} SDK install" to look up the recommended SDK package and installation instructions. If the call fails, continue — step 2 will fall back to the framework's default package.

## 2. Install SDK

Print "STATUS: Installing SDK..."

Detect the project's package manager from its lockfile (pnpm-lock.yaml → pnpm, yarn.lock → yarn, package-lock.json → npm, go.sum → go, Pipfile.lock / requirements.txt → pip, Package.swift → swift). Install the SDK package recommended by the docs lookup; if unavailable, fall back to the framework's default SDK package.

Do NOT set up feature flags, event tracking, or session recordings — only install the SDK dependency.

## 3. Verify

Print "STATUS: Verifying installation..."

Read the project's dependency manifest (package.json, go.mod, requirements.txt, etc.) and confirm the SDK package appears. Print a one-line summary of what was installed.

## Rules

- Prefix every progress update with "STATUS: " — these are shown in the UI.
- Only install the SDK — do not configure providers, create flags, or add instrumentation.
- Use the project's existing package manager; never switch to a different one.
- Only create or modify files inside the project directory.
- If a step fails, print the error and continue with remaining steps.
