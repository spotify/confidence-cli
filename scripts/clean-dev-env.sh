#!/usr/bin/env bash
#
# Resets the local dev environment to simulate a clean machine for testing.
# Usage: ./scripts/clean-dev-env.sh [--auth | --mcp] [project-dir]
#
# Options:
#   --auth   Clean only auth tokens
#   --mcp    Clean only MCP servers, permissions, and skills
#   (none)   Clean everything (default)
#
set -euo pipefail

# --- Parse arguments ---

clean_auth=false
clean_mcp=false
PROJECT_DIR="."

for arg in "$@"; do
  case "$arg" in
    --auth) clean_auth=true ;;
    --mcp)  clean_mcp=true ;;
    -*)     echo "Unknown option: $arg"; exit 1 ;;
    *)      PROJECT_DIR="$arg" ;;
  esac
done

# Default: clean everything
if ! $clean_auth && ! $clean_mcp; then
  clean_auth=true
  clean_mcp=true
fi

removed=0

# --- Auth tokens ---

if $clean_auth; then
  token_file="${TMPDIR:-/tmp}/confidence_token"
  refresh_file="${TMPDIR:-/tmp}/confidence_refresh_token"

  for f in "$token_file" "$refresh_file"; do
    if [[ -f "$f" ]]; then
      rm "$f"
      echo "Removed $f"
      ((removed++))
    fi
  done
fi

# --- MCP-related cleanup ---

if $clean_mcp; then

  # --- Confidence MCP preference ---

  mcp_pref_file="${TMPDIR:-/tmp}/confidence_mcp_preference"
  if [[ -f "$mcp_pref_file" ]]; then
    rm "$mcp_pref_file"
    echo "Removed $mcp_pref_file"
    ((removed++))
  fi

  # --- Confidence AI plugin skills ---

  skills_dirs=("$PROJECT_DIR/.claude/skills" "$PROJECT_DIR/.cursor/skills" "$PROJECT_DIR/.agents/skills")
  confidence_skills=(
    onboard-confidence
    onboard-confidence-dry-run
    setup-warehouse
    setup-warehouse-bigquery
    setup-warehouse-databricks
    setup-warehouse-redshift
    setup-warehouse-snowflake
    migrate-eppo
    migrate-optimizely
    migrate-posthog
    migrate-statsig
  )

  for skills_dir in "${skills_dirs[@]}"; do
    for skill in "${confidence_skills[@]}"; do
      skill_dir="$skills_dir/$skill"
      if [[ -d "$skill_dir" ]]; then
        rm -rf "$skill_dir"
        echo "Removed skill $skill from $skills_dir"
        ((removed++))
      fi
    done
  done

  # --- MCP server entries from config files ---

  remove_all_mcp_entries() {
    local config_path="$1"
    [[ -f "$config_path" ]] || return 0

    local result
    result=$(node -e '
      const fs = require("fs");
      const path = process.argv[1];
      const config = JSON.parse(fs.readFileSync(path, "utf-8"));
      if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) { process.exit(0); }
      const names = Object.keys(config.mcpServers);
      delete config.mcpServers;
      if (Object.keys(config).length === 0) {
        fs.unlinkSync(path);
        console.log("deleted:" + names.join(","));
      } else {
        fs.writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
        console.log("cleaned:" + names.join(","));
      }
    ' "$config_path" 2>/dev/null) || return 0

    local action="${result%%:*}"
    local names="${result#*:}"
    if [[ "$action" == "deleted" ]]; then
      echo "Deleted $config_path (empty after removing MCP servers: $names)"
      ((removed++))
    elif [[ "$action" == "cleaned" ]]; then
      echo "Removed all MCP entries from $config_path ($names)"
      ((removed++))
    fi
  }

  # Discover all locally-configured MCP servers (skip cloud "claude.ai" connectors)
  mcp_servers=()
  while IFS= read -r server; do
    [[ -n "$server" ]] && mcp_servers+=("$server")
  done < <(
    (cd "$PROJECT_DIR" && claude mcp list 2>&1) \
      | grep -v '^claude\.ai ' \
      | grep -v '^Checking' \
      | grep -v '^$' \
      | sed 's/:.*//'
  )

  # Use `claude mcp remove` to clear each server's entries and approval state (all scopes)
  for server in ${mcp_servers[@]+"${mcp_servers[@]}"}; do
    for scope in local project user; do
      if (cd "$PROJECT_DIR" && claude mcp remove --scope "$scope" "$server") 2>/dev/null; then
        echo "Removed MCP server $server from $scope scope"
        ((removed++))
      fi
    done
  done

  # Remove .mcp.json entirely
  if [[ -f "$PROJECT_DIR/.mcp.json" ]]; then
    rm "$PROJECT_DIR/.mcp.json"
    echo "Removed $PROJECT_DIR/.mcp.json"
    ((removed++))
  fi

  # Clean Cursor MCP configs and agent state
  remove_all_mcp_entries "$PROJECT_DIR/.cursor/mcp.json"
  remove_all_mcp_entries "$HOME/.cursor/mcp.json"
  for server in confidence-flags confidence-docs; do
    if cursor agent mcp disable "$server" 2>/dev/null; then
      echo "Disabled Cursor agent MCP server $server"
      ((removed++))
    fi
  done

  # Clean legacy Claude MCP config
  remove_all_mcp_entries "$HOME/.claude.json"

  # Clean Codex MCP config (TOML format) — both project-level and global
  codex_configs=("$PROJECT_DIR/.codex/config.toml" "$HOME/.codex/config.toml")
  for codex_config in "${codex_configs[@]}"; do
    if [[ -f "$codex_config" ]]; then
      for server in confidence-flags confidence-docs; do
        codex mcp remove "$server" 2>/dev/null || true
      done
      # Remove the config if it only contained our MCP entries
      if [[ -f "$codex_config" ]]; then
        remaining=$(grep -c '^\[' "$codex_config" 2>/dev/null || echo "0")
        if [[ "$remaining" -eq 0 ]]; then
          rm "$codex_config"
          echo "Deleted $codex_config (empty after cleanup)"
          ((removed++))
        else
          echo "Cleaned Codex MCP entries from $codex_config"
          ((removed++))
        fi
      fi
    fi
  done

  # --- MCP tool permissions from .claude/settings*.json ---

  remove_mcp_permissions() {
    local settings_path="$1"
    [[ -f "$settings_path" ]] || return 0

    local settings_result
    settings_result=$(node -e '
      const fs = require("fs");
      const path = process.argv[1];
      const config = JSON.parse(fs.readFileSync(path, "utf-8"));
      const allow = config.permissions?.allow;
      if (!Array.isArray(allow)) { process.exit(0); }
      const before = allow.length;
      const filtered = allow.filter(p => !p.startsWith("mcp__"));
      if (filtered.length === before) { process.exit(0); }
      config.permissions.allow = filtered;
      if (filtered.length === 0) delete config.permissions.allow;
      if (Object.keys(config.permissions).length === 0) delete config.permissions;
      if (Object.keys(config).length === 0) {
        fs.unlinkSync(path);
        console.log("deleted");
      } else {
        fs.writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
        console.log("cleaned");
      }
    ' "$settings_path" 2>/dev/null) || return 0

    if [[ "$settings_result" == "deleted" ]]; then
      echo "Deleted $settings_path (empty after cleanup)"
      ((removed++))
    elif [[ "$settings_result" == "cleaned" ]]; then
      echo "Removed MCP tool permissions from $settings_path"
      ((removed++))
    fi
  }

  remove_mcp_permissions "$PROJECT_DIR/.claude/settings.json"
  remove_mcp_permissions "$PROJECT_DIR/.claude/settings.local.json"
fi

# --- Summary ---

if ((removed == 0)); then
  echo "Nothing to clean — environment already clean."
else
  echo ""
  echo "Done. Cleaned $removed item(s)."
fi
