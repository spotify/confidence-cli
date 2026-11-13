# Data API gaps for direct CLI access (PR9)

## Decision and scope

Use direct CLI HTTP primitives for existing Confidence APIs, not a new Data MCP dependency. The CLI should handle authenticated requests, input/output and bounded job polling. Guided discovery, classification, review, approval and retries belong in a separate skill or workflow, not in a CLI orchestration command.

This PR is documentation only. It adds no commands, backend implementation or Jira changes. In particular, it does not add `data onboard`, `data discover`, `data run` or `data workflow`. It does not implement warehouse discovery by sending catalog SQL through the preview API.

The [integration proposal][integration] is marked **In Review**. Its proposed Data MCP architecture is superseded by the user's direct-CLI decision for this work. Its capability requirements remain useful background, not proof that proposed tools exist. The [feature spec][spec] describes the desired onboarding experience, not the current API contract.

## Evidence and limits

Source snapshots inspected:

| Repository                                                 | Commit                                     | Relevant source paths                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analytics-platform-tooling/confidence-context-management` | `df03db8655404c9306dc70569ad7cdb56e39d2ef` | `src/main/proto/confidence/metrics/v1/{api,internal_api,metrics}.proto`; `src/main/proto/confidence/insights/v1/{context_api,context_messages}.proto`; `src/main/java/com/spotify/confidence/contextmanagement/sync/FactTableSyncService.java` |
| `konfidens/konfidens-mcp`                                  | `b84730e27f9f7b590880918e4b13956de2702614` | `src/main/java/com/spotify/konfidensmcp/DataMcpService.java`; `src/main/java/com/spotify/konfidensmcp/services/{MetricsClientService,MetricsClientServiceFactory}.java`; `src/main/java/com/spotify/konfidensmcp/tools/ListFactTables.java`    |

Links below pin exact paths and lines to these commits. The Metrics protos are the contract copy in context management; this is not an audit of the Metrics server implementation or deployed gateway. Existing MCP code is supporting evidence of backend reuse, not a dependency of the chosen CLI architecture. For example, [DataMcpService delegates fact-table listing][mcp-data] to an adapter that [calls MetricsService][mcp-client], whose [factory targets `epx-metrics`][mcp-factory].

No live public HTTP, regional routing or authorization checks were performed. No credentials or `.env` files were read. A contract present in source is not proof of a deployed public route. Equally, an implementation not audited here must not be called missing.

Status terms used below:

- **Existing RPC**: defined in the inspected contract; suitable for a thin HTTP primitive once runtime access is verified.
- **Backend contract gap**: the required dedicated operation or guarantee is not established by that contract. This does not claim that no other service implements it.
- **Separate workflow**: behavior beyond a request/response primitive, with product or agent policy decisions.
- **Public runtime not verified**: routing, authentication, authorization or end-to-end availability still needs testing; not a claim of absence.

## Capability matrix

| Capability                                  | Evidence                                                                                                                                                                             | Assessment and practical consequence                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Warehouse connection configuration          | [Warehouse RPCs][warehouse-routes] and [validation request/response][warehouse-requests]                                                                                             | **Existing RPC.** List/get/create/update, existence check and config validation are distinct from discovering physical tables.                                                                                                                                           |
| Registered fact and dimension tables        | [Fact RPCs][fact-routes], [dimension RPCs][dimension-routes] and their [list requests][fact-requests]/[responses][dimension-requests]                                                | **Existing RPC.** These list Confidence resources, not every physical table accessible in the warehouse.                                                                                                                                                                 |
| Physical warehouse table inventory          | The inspected [MetricsService declaration][metrics-service] has no dedicated physical table inventory RPC. [Config validation][warehouse-requests] returns some connection metadata. | **Backend contract gap.** Need scoped, read-only, paginated inventory with explicit visibility limits; do not relabel registered fact tables or preview results as discovery. See [SLMD-1585][jira-1585].                                                                |
| Full physical schema and profiling metadata | [Column][columns] has name, type and repeated flag; [successful query results][query-results] expose result schema and issues.                                                       | **Backend contract gap.** Query-output schema is available, but a complete physical-schema discovery contract is not established: physical column metadata, nested structure, nullability, descriptions, row estimates and partition/cluster keys need coverage defined. |
| SQL preview, status and sample rows         | [Preview/job routes][sql-routes], [preview request/response][preview-requests], [SqlJob and SampleRows][sql-models]                                                                  | **Existing RPC.** Preview starts a limited query and returns a job reference; status and samples are separate reads. This is not a full catalog API or a discovery fallback.                                                                                             |
| Fact-table column suggestions               | [Suggestion route][suggest-route] and [request/response][suggest-messages]                                                                                                           | **Existing RPC, helper only.** Suggests timestamp, entity, measure and dimension columns for a supplied schema. It is not full import recommendations.                                                                                                                   |
| Source identity and reconciliation          | Resource [SQL, names and labels][fact-model]; optional [fact-table IDs][fact-requests] and [dimension-table IDs][dimension-requests]                                                 | **Backend contract gap.** A stable physical source identity, uniqueness rules and idempotent reconciliation guarantees are not established. Client-assigned resource IDs alone do not provide them.                                                                      |
| Registration and validation status          | [Fact state/error/schema job][fact-model], [dimension equivalents][dimension-model], [TableState][table-state]                                                                       | **Existing RPC.** Can report resource validation state and errors. Do not report agent readiness from `ACTIVE` alone.                                                                                                                                                    |
| Fact context and sync                       | [Context read routes][context-reads], [curation and sync routes][context-writes], [sync implementation][sync-implementation]                                                         | **Existing RPC/code; public runtime not verified.** Fact context and sync exist. They do not establish a public end-to-end readiness contract across fact, dimension and standalone context tables. See [SLMD-1935][jira-1935].                                          |
| Standalone context-table registration       | [InsightsTableContext][context-model] is linked to a fact table; [InsightsDocument][document-model] stores text or a URI.                                                            | **Ownership unresolved.** Existing context curation is not proof of a general queryable context-table registration API. Decide the owning resource/service before exposing registration. See [SLMD-1858][jira-1858].                                                     |
| Full recommendations and approval           | [Suggestion output][suggest-messages] covers columns; the [spec][spec] requires table type, SQL, mappings, reasoning and review.                                                     | **Separate workflow.** Define its output and skill/backend split; do not treat the suggestion helper as a complete recommender. See [SLMD-1933][jira-1933].                                                                                                              |
| Warnings, safe aggregation and join trust   | [Query issues][query-results] and [context examples][context-examples] are existing data structures.                                                                                 | **Separate downstream workflow/policy.** Returning warnings or SQL does not establish enforcement in agent answers. Verify downstream behavior rather than claiming it is absent. See [SLMD-1936][jira-1936].                                                            |

## Existing HTTP contracts and body bindings

The Metrics contract declares `metrics.eu.confidence.dev`, `metrics.us.confidence.dev` and `metrics.confidence.dev` as [service hosts][metrics-hosts]. These are source-declared hosts, not a verified deployment/region-selection matrix. The following tables record existing bindings, not proposed CLI command syntax.

Body selectors below use the exact protobuf spelling. For a selector such as `fact_table`, the HTTP body is the fact-table object itself, **not** a `{ "factTable": ... }` request wrapper. `body: "*"` instead binds the request fields not consumed by the path. Other request fields go in query parameters. JSON names use lower camel case, for example `factTableId` and `updateMask`; field-mask paths are relative to the resource, not prefixed with `fact_table` or `dimension_table` ([fact request fields][fact-requests], [dimension request fields][dimension-requests]).

### Warehouses and entities

| RPC                           | HTTP route                                         | Body selector / other inputs                            | Source                                                   |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `ListDataWarehouses`          | `GET /v1/dataWarehouses`                           | No body; `page_size`, `page_token`                      | [Routes][warehouse-routes], [fields][warehouse-requests] |
| `GetDataWarehouse`            | `GET /v1/{name=dataWarehouses/*}`                  | No body; resource name in path                          | [Routes][warehouse-routes], [fields][warehouse-requests] |
| `ExistsDataWarehouses`        | `GET /v1/dataWarehouses:exists`                    | No body                                                 | [Routes][warehouse-routes]                               |
| `CreateDataWarehouse`         | `POST /v1/dataWarehouses`                          | `data_warehouse`; optional `data_warehouse_id` in query | [Routes][warehouse-routes], [fields][warehouse-requests] |
| `UpdateDataWarehouse`         | `PATCH /v1/{data_warehouse.name=dataWarehouses/*}` | `data_warehouse`; `update_mask` in query                | [Routes][warehouse-routes], [fields][warehouse-requests] |
| `ValidateDataWarehouseConfig` | `POST /v1/dataWarehouseConfig:validate`            | `*`; config oneof and optional `existing_warehouse`     | [Routes][warehouse-routes], [fields][warehouse-requests] |
| `ListEntities` / `GetEntity`  | `GET /v1/entities` / `GET /v1/{name=entities/*}`   | No body; list supports paging, filter and order         | [Routes][entity-routes], [fields][entity-requests]       |
| `CreateEntity`                | `POST /v1/entities`                                | `entity`; optional `entity_id` in query                 | [Routes][entity-routes], [fields][entity-requests]       |
| `UpdateEntity`                | `PATCH /v1/{entity.name=entities/*}`               | `entity`; `update_mask` in query                        | [Routes][entity-routes], [fields][entity-requests]       |
| `DeleteEntity`                | `DELETE /v1/{name=entities/*}`                     | No body                                                 | [Routes][entity-routes]                                  |

The inspected validation request supports BigQuery, Snowflake and Redshift configurations. Its response can include Redshift schemas, Snowflake databases/warehouses/roles/schemas or a BigQuery location. That is useful connection metadata, **not** physical table inventory or complete schema discovery. Do not infer validation support for every warehouse type from create support ([validation fields][warehouse-requests]). An [Entity][entity-model] supplies a display name and primary-key type for mappings; entity lookup is reusable rather than a new discovery service.

### Fact and dimension resources

| RPC                                         | HTTP route                                                     | Body selector / other inputs                              | Source                                                   |
| ------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `ListFactTables` / `GetFactTable`           | `GET /v1/factTables` / `GET /v1/{name=factTables/*}`           | No body; list fields below                                | [Routes][fact-routes], [fields][fact-requests]           |
| `CreateFactTable`                           | `POST /v1/factTables`                                          | `fact_table`; optional `fact_table_id` in query           | [Routes][fact-routes], [fields][fact-requests]           |
| `UpdateFactTable`                           | `PATCH /v1/{fact_table.name=factTables/*}`                     | `fact_table`; `update_mask` in query                      | [Routes][fact-routes], [fields][fact-requests]           |
| `DeleteFactTable`                           | `DELETE /v1/{name=factTables/*}`                               | No body; deletion is constrained by metric references     | [Routes][fact-routes]                                    |
| `UndeleteFactTable`                         | `POST /v1/{name=factTables/*}:undelete`                        | `*`                                                       | [Routes][fact-routes]                                    |
| `ListDimensionTables` / `GetDimensionTable` | `GET /v1/dimensionTables` / `GET /v1/{name=dimensionTables/*}` | No body; list fields below                                | [Routes][dimension-routes], [fields][dimension-requests] |
| `CreateDimensionTable`                      | `POST /v1/dimensionTables`                                     | `dimension_table`; optional `dimension_table_id` in query | [Routes][dimension-routes], [fields][dimension-requests] |
| `UpdateDimensionTable`                      | `PATCH /v1/{dimension_table.name=dimensionTables/*}`           | `dimension_table`; `update_mask` in query                 | [Routes][dimension-routes], [fields][dimension-requests] |
| `DeleteDimensionTable`                      | `DELETE /v1/{name=dimensionTables/*}`                          | No body; deletion is constrained by metric use            | [Routes][dimension-routes]                               |

Both lists accept `page_size`, `page_token`, `filter`, `show_deleted` and `order_by`, and return resources plus `next_page_token`. Optional create IDs default to random IDs when omitted ([fact fields][fact-requests], [dimension fields][dimension-requests]). These are registered-resource pages, not warehouse catalog pages. The existing [MCP list formatter][mcp-list] likewise formats registered facts and their state.

The [FactTable model][fact-model] already carries `sql`, `display_name`, `description`, `timestamp_column`, entity mappings, measures, dimensions and labels. The [DimensionTable model][dimension-model] has `sql`, `display_name`, `description`, an entity mapping, dimensions, labels and optional time configuration. Several mapping fields are immutable; update is not unrestricted reclassification. Both models expose `state`, `error` and `schema_validation_job`.

### SQL preview and the suggestion helper

| RPC                       | HTTP route                                    | Body selector / result                                  | Source                                             |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| `PreviewSqlQuery`         | `POST /v1/sqlQuery:preview`                   | `*`; request `query`, response `job`                    | [Routes][sql-routes], [fields][preview-requests]   |
| `GetSqlJob`               | `GET /v1/{name=sqlJobs/*}`                    | No body; job state and result                           | [Routes][sql-routes], [model][sql-models]          |
| `GetSampleRows`           | `GET /v1/{name=sqlJobs/*}/sampleRows`         | No body; schema/result and sample rows                  | [Routes][sql-routes], [model][sql-models]          |
| `CancelSqlJob`            | `POST /v1/{name=sqlJobs/*}:cancel`            | `*`; applicable to a running job                        | [Routes][sql-routes]                               |
| `SuggestFactTableColumns` | `POST /v1/factTables:suggestFactTableColumns` | `*`; request `schema`, response `suggestion` or `error` | [Route][suggest-route], [fields][suggest-messages] |

Preview explicitly applies a small `LIMIT` to learn query-output schema. `SqlJob` includes running, pending, completed, failed, cancelled, retry and throttled states; results distinguish success, failure and pending. Successful results have schema, column issues and table issues; failures have an error and reason ([preview contract][sql-routes], [job model][sql-models], [result fields][query-results]). A CLI primitive can expose these without pretending that a successful preview establishes complete table discovery or semantic safety.

The suggestion request accepts columns, typically from `SampleRows.successful_query_result.schema`. Its output is a timestamp column, entity mappings, measure names and dimension names. It does not return a table-type decision, domain grouping, generated import SQL, approval, business definitions or a complete warning policy ([suggestion messages][suggest-messages]).

### Insights context bindings (public runtime not verified)

These bindings are present in the Insights contract. Do not assume they use a Metrics host or that they are publicly callable with the CLI's token.

| RPC                                                     | HTTP route                                                                 | Body selector                                    | Source                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `ListFactTableSummaries` / `GetFactTableSummary`        | `GET /v1/factTableSummaries` / `GET /v1/{name=factTableSummaries/*}`       | No body                                          | [Read routes][context-reads]                                  |
| `SearchFactTableSummaries`                              | `GET /v1/factTableSummaries:search`                                        | No body; query inputs                            | [Read routes][context-reads]                                  |
| `ListFactTableContexts` / `GetFactTableContext`         | `GET /v1/factTableContexts` / `GET /v1/{name=factTableContexts/*}`         | No body                                          | [Read routes][context-reads]                                  |
| `ListSuggestedQuestions`                                | `GET /v1/suggestedQuestions`                                               | No body                                          | [Read routes][context-reads]                                  |
| `ListInsightsTableContexts` / `GetInsightsTableContext` | `GET /v1/insightsTableContexts` / `GET /v1/{name=insightsTableContexts/*}` | No body                                          | [Curation routes][context-writes]                             |
| `UpdateInsightsTableContext`                            | `PATCH /v1/{insights_table_context.name=insightsTableContexts/*}`          | `insights_table_context`; `update_mask` in query | [Routes][context-writes], [fields][context-curation-requests] |
| `SyncInsightsTableContexts`                             | `POST /v1/insightsTableContexts:sync`                                      | `*`; optional `include_enrichment`               | [Routes][context-writes], [fields][context-examples]          |

## Gaps and decisions before promising onboarding

### 1. Physical discovery needs a dedicated backend contract

[SLMD-1585][jira-1585] calls for accessible tables and schemas with filters, bounded pagination and warehouse-specific visibility behavior. No dedicated inventory or physical-schema discovery RPC appears in the inspected [MetricsService][metrics-service]. The local internal contract is explicitly a **client subset**; its [read-only `ExecuteSqlQuery`][internal-sql] has row/timeout inputs but no HTTP binding and is not a catalog discovery contract.

Define inventory and schema operations with account isolation, supported warehouse coverage, normalized source identifiers, paging, permission errors, timeouts and cost/row limits. State what metadata is unavailable. Never invent inaccessible table names or counts. BigQuery, Snowflake and Databricks visibility semantics need explicit treatment; verify Redshift coverage or exclude it. Do not make the CLI implement discovery with SQL-preview queries as a substitute.

### 2. Stable source identity is more than a resource ID

The [fact][fact-model] and [dimension][dimension-model] models expose SQL and arbitrary labels, while create requests allow chosen resource IDs. The inspected contract does not establish a canonical warehouse/project/database/schema/table identity, source uniqueness, duplicate prevention or reconciliation behavior after SQL edits, renames or retries.

Agree the source-to-resource mapping, multi-source SQL behavior, collision rules and create/retry semantics with the backend. Do not promise idempotent import by hashing SQL, choosing IDs or adding undocumented labels in the CLI. This is a guarantee to establish, not evidence that the server has no idempotency behavior today. The [integration proposal][integration] asks for stable source identity and idempotent creation.

### 3. Context APIs exist; public access and readiness remain unverified

The Insights contract already defines [fact summaries, full context and suggested-question reads][context-reads], plus [context curation and sync][context-writes]. `InsightsTableContext` has a fact-table reference, enabled flag, capability summary, markdown, DDL and examples ([model][context-model]). Sync optionally schedules enrichment and returns total/created/skipped/failed counts, not per-table readiness stages ([sync messages][context-examples]).

There is implementation evidence, not just a proposal: [FactTableSyncService][sync-implementation] processes fact tables, checks active/system-created status, creates context when absent and schedules enrichment. Do not call sync missing. That evidence does not establish dimension or standalone context-table coverage, a unified public readiness response or a successful deployed import-to-answer path.

Metrics [TableState][table-state] describes resource lifecycle, not agent visibility or answer readiness. The fact model even permits [skipping preview and going directly to `ACTIVE`][fact-model]. Define how registration, preparation, visibility and availability relate; include failure/recovery information and bounded polling. Verify when suggested questions can safely use a table. Rich enrichment need not be the minimum availability gate ([SLMD-1935][jira-1935]).

For public access, verify the actual host, gateway registration, region selection, CLI token acceptance, account isolation and role checks. The [Insights annotations][context-reads] use `allow_empty_permissions` and describe JWT-derived accounts; that is not proof of anonymous access or a validated public authorization model. Metrics has its own method-specific [auth annotations][fact-routes]. Treat public context/readiness routing and auth as **not verified**, not as known missing implementations.

### 4. Context-table ownership is still a product/backend decision

The [spec's open questions][spec] and [SLMD-1858][jira-1858] leave standalone context-table storage/ownership unresolved. Existing fact-linked curation and [text/URI documents][document-model] must not be presented as registration of arbitrary, read-only queryable warehouse tables.

Choose the owning resource/service and define source SQL/reference, schema, description, domain, known grain, warnings, lifecycle and account/role checks. Confirm supported table kinds before exposing registration. Context tables remain outside the promised registration surface until that decision is made; this does not imply that all context-related APIs are absent.

### 5. Recommendations and safety are not HTTP transport features

[SLMD-1933][jira-1933] describes recommendations for fact, dimension, context or exclusion, with SQL, mappings, reasons, domain grouping and warnings. Reuse the existing column-suggestion helper, but define the remaining skill/backend split separately. Keep proposals non-mutating, uncertain mappings pending and creation behind explicit review. Treat warehouse metadata as untrusted data, not permission to execute tools.

[SLMD-1936][jira-1936] describes downstream warning, aggregation and join rules. Schema `TableIssue` warnings are not the same as business-semantic warnings or enforcement. Existing [example question/SQL fields][context-examples] also do not establish join verification policy. Decide whether unreviewed joins are blocked or allowed with a visible warning, and test answer behavior, including unsafe aggregation such as summing daily distinct users into weekly distinct users. This report does not audit or claim absence of downstream enforcement.

Metric/KPI modeling, experiments, cross-table relationship discovery and example-verification lifecycle are separate workflows, not implicit effects of importing a table. The [spec][spec] separates metric modeling from onboarding; [SLMD-1936][jira-1936] leaves new relationship discovery and cross-table example lifecycle outside its scope.

## Follow-up and references

A practical next step is to verify public runtime access for the existing HTTP bindings, then agree backend contracts for physical discovery and source reconciliation. Resolve context ownership and readiness coverage separately. Build guided recommendations/review and downstream safety on top of those primitives, without introducing a Data MCP requirement or unsupported CLI orchestration commands.

Planning references (read only; no Jira changes made):

- [Integration proposal — In Review][integration]: historical Data MCP design; transport choice superseded here by the user's decision.
- [Feature Spec: Confidence Data Onboarding][spec]: intended experience and unresolved context storage.
- [SLMD-1585 — List accessible warehouse tables through an API][jira-1585].
- [SLMD-1858 — Implement context tables for the data agent][jira-1858].
- [SLMD-1933 — Generate table import recommendations][jira-1933].
- [SLMD-1935 — Expose table readiness for the data agent][jira-1935].
- [SLMD-1936 — Apply data warnings and join rules to answers][jira-1936].
- [SLMD-1921 — Expose onboarding APIs through data MCP][jira-1921]: historical adapter scope, not the selected direct-CLI architecture.

At inspection, SLMD-1585 was **To Do** and the other five tickets were **Cancelled**. Their descriptions are useful requirements/history, not active delivery commitments or evidence of deployed behavior.

[integration]: https://docs.google.com/document/d/1AW-_T8e3CTOSg4DPIgRiuTCXNlqjgWO4abJk8wmBdRQ/edit
[spec]: https://docs.google.com/document/d/1n4Z9fc-UzV8GplZTz_ub6Ll_tiC0mLTPDQ1GPcfGWxc/edit
[jira-1585]: https://spotify.atlassian.net/browse/SLMD-1585
[jira-1858]: https://spotify.atlassian.net/browse/SLMD-1858
[jira-1933]: https://spotify.atlassian.net/browse/SLMD-1933
[jira-1935]: https://spotify.atlassian.net/browse/SLMD-1935
[jira-1936]: https://spotify.atlassian.net/browse/SLMD-1936
[jira-1921]: https://spotify.atlassian.net/browse/SLMD-1921
[metrics-service]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L28-L1327
[metrics-hosts]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L28-L32
[warehouse-routes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L1002-L1090
[warehouse-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L1519-L1646
[entity-routes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L90-L152
[entity-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L1810-L1856
[entity-model]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L19-L72
[fact-routes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L213-L289
[fact-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L1980-L2045
[fact-model]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L364-L480
[dimension-routes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L355-L422
[dimension-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L2140-L2211
[dimension-model]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L507-L643
[sql-routes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L34-L88
[preview-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L1457-L1467
[sql-models]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L154-L299
[columns]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L301-L349
[query-results]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L2887-L2957
[suggest-route]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L488-L498
[suggest-messages]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/api.proto#L2280-L2322
[table-state]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/metrics.proto#L4039-L4057
[internal-sql]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/metrics/v1/internal_api.proto#L12-L26
[context-reads]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_api.proto#L18-L90
[context-writes]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_api.proto#L147-L193
[context-model]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_messages.proto#L100-L174
[document-model]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_messages.proto#L176-L251
[context-curation-requests]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_messages.proto#L314-L353
[context-examples]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/proto/confidence/insights/v1/context_messages.proto#L355-L384
[sync-implementation]: https://ghe.spotify.net/analytics-platform-tooling/confidence-context-management/blob/df03db8655404c9306dc70569ad7cdb56e39d2ef/src/main/java/com/spotify/confidence/contextmanagement/sync/FactTableSyncService.java#L92-L226
[mcp-data]: https://ghe.spotify.net/konfidens/konfidens-mcp/blob/b84730e27f9f7b590880918e4b13956de2702614/src/main/java/com/spotify/konfidensmcp/DataMcpService.java#L54-L71
[mcp-client]: https://ghe.spotify.net/konfidens/konfidens-mcp/blob/b84730e27f9f7b590880918e4b13956de2702614/src/main/java/com/spotify/konfidensmcp/services/MetricsClientService.java#L113-L121
[mcp-factory]: https://ghe.spotify.net/konfidens/konfidens-mcp/blob/b84730e27f9f7b590880918e4b13956de2702614/src/main/java/com/spotify/konfidensmcp/services/MetricsClientServiceFactory.java#L6-L16
[mcp-list]: https://ghe.spotify.net/konfidens/konfidens-mcp/blob/b84730e27f9f7b590880918e4b13956de2702614/src/main/java/com/spotify/konfidensmcp/tools/ListFactTables.java#L25-L91
