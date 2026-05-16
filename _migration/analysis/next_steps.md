# Next Steps

Use this prompt after approving the intake folder.

```text
Work in NEW ROOT only:
/Users/marcusbivines/FlavorOS_1.5

Use only copied intake material under:
/Users/marcusbivines/FlavorOS_1.5/_migration/intake/

Do not read from OLD ROOT directly unless explicitly approved.
Do not modify app, docs, services, agents, configs, runtime, or deployment folders outside _migration.
Do not install dependencies.
Do not run migrations.
Do not start servers.
Do not delete files.
Do not modify git state.

Task:
Transform the copied intake material into prepared migration candidates under:
_migration/prepared/

Required workflow:
1. Read _migration/decisions.md and use it as controlling architecture.
2. Read _migration/source_inventory.md.
3. Classify intake material by domain:
   - docs
   - ui
   - agents
   - workflows
   - schemas
   - runtime
   - deployment
   - secrets_protocol
4. For each domain, create normalized candidate files under the matching _migration/prepared/ folder.
5. Do not copy intake files directly as canon. Rewrite them into FlavorOS 1.5-compatible candidates.
6. Preserve provenance notes linking back to intake source paths.
7. Mark anything voice-forward, persistent-chat-forward, call-surface-forward, Obsidian-bound, five-agent-runtime-bound, secret-adjacent, or old-12-hour-MVP-bound as future-state/archive/reference unless the current decisions explicitly allow it.

Required output:
1. Summary of prepared files created
2. Source intake files used for each prepared candidate
3. Items intentionally archived or deferred
4. Risks and unresolved questions
5. Recommended approval prompt for moving prepared candidates into real repo locations
```
