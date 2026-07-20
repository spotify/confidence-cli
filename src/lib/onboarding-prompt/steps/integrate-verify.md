### {{STEP}}e. Verify the project builds

Print "STATUS: Verifying project builds..."

Run the project's build or type-check command to catch errors early. Detect the right command — don't assume one exists:

- JS/TS: prefer the project's own `build` script, fall back to `tsc --noEmit` if tsconfig.json exists, skip otherwise. Server SDKs use a Rust-based WebAssembly resolver — verify Node.js 18+ is available.
- Python: `python3 -c "import confidence"`
- Go: `go build ./...`
- Java/Kotlin: `./gradlew compileJava` or `mvn compile`

If the build fails, read the errors, fix the integration code, and re-check before continuing.
