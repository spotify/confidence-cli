## {{STEP}}. Scaffold sample app

Print "STATUS: Scaffolding sample {{FRAMEWORK}} application..."

The project directory is empty. Generate a sample application for {{FRAMEWORK}}:

- Initialize the project (package.json / go.mod / build.gradle / Package.swift / etc.) — print "STATUS: Initializing {{FRAMEWORK}} project..."
- Create a runnable entry point with a main function or equivalent — print "STATUS: Creating entry point..."
- Include at least one user-facing feature or behavior that can later be controlled by a feature flag (e.g. a greeting message, a theme, an output format, or a premium feature gate)
- Include a README.md with a one-liner on how to run the app
- If the project directory is not already a git repository, initialize one (`git init` and an initial commit) so that IDE agents can operate in the project directory — print "STATUS: Initializing git repository..."
- Print "STATUS: Installing dependencies..." before running any package install command
