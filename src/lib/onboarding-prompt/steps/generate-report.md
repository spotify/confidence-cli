## {{STEP}}. Generate report

Print "STATUS: Generating quickstart report..."

Always generate this file, even if earlier steps partially failed.

Write a CONFIDENCE_QUICKSTART.md file in the project root with this structure:

{{REPORT_START}}
{{HOW_TO_RUN}}
{{SKILLS_NOTE}}{{REPORT_END}}

Fill in all actual values from the preceding steps. For the SDK reference link, use the docs MCP if available, otherwise search the web for the relevant SDK page at {{DOCS_URL}}. If no URL is found, omit that line rather than guessing.
