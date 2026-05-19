#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

python3 - <<'PY'
from pathlib import Path
import re
import sys

root = Path.cwd()
agents_yaml = (root / "configs/agents.yaml").read_text()
runtimes_yaml = (root / "configs/runtimes.yaml").read_text()

expected = {
    "khadijah_conductor": {
        "runtime": "cloud",
        "engine": "hermes",
        "service": "flavoros-agent-khadijah-hermes",
        "agent_config": "agents/khadijah/agent.yaml",
        "instruction_root": "agents/khadijah",
    },
    "regine_research_logistics": {
        "runtime": "cloud",
        "engine": "openclaw",
        "service": "flavoros-agent-regine-openclaw",
        "agent_config": "agents/regine/agent.yaml",
        "instruction_root": "agents/regine",
    },
    "sinclair_communications": {
        "runtime": "local",
        "engine": "hermes",
        "service": "flavoros-agent-sinclair-hermes",
        "agent_config": "agents/sinclair/agent.yaml",
        "instruction_root": "agents/sinclair",
    },
}

errors: list[str] = []

def block_for(name: str) -> str:
    pattern = rf"^  {re.escape(name)}:\n(?P<body>(?:    .+\n|      .+\n)*)"
    match = re.search(pattern, agents_yaml, re.MULTILINE)
    if not match:
        errors.append(f"missing agent block: {name}")
        return ""
    return match.group("body")

for name, fields in expected.items():
    block = block_for(name)
    for key, value in fields.items():
        if f"    {key}: {value}" not in block:
            errors.append(f"{name} missing {key}: {value}")

    agent_config = root / fields["agent_config"]
    instruction_root = root / fields["instruction_root"]
    if not agent_config.is_file():
        errors.append(f"{name} agent_config does not exist: {fields['agent_config']}")
    if not instruction_root.is_dir():
        errors.append(f"{name} instruction_root does not exist: {fields['instruction_root']}")
    for child in ("skills", "protocols"):
        if not (instruction_root / child).exists():
            errors.append(f"{name} instruction_root missing {child}/")

enabled_match = re.search(r"^enabled:\n(?P<body>(?:  - .+\n)+)", agents_yaml, re.MULTILINE)
if not enabled_match:
    errors.append("missing enabled list")
else:
    enabled = {line.strip()[2:] for line in enabled_match.group("body").splitlines()}
    for name in expected:
        if name not in enabled:
            errors.append(f"{name} is not enabled")

runtime_needles = [
    "agent_engines:",
    "hermes:",
    "openclaw:",
    "cloud_vps:",
    "ssh_host: root@2.24.65.59",
    "repo_dir: /srv/flavoros",
    "local_private:",
    "launch_command: scripts/run-local-hermes-sinclair.sh",
    "flavoros-agent-khadijah-hermes.service",
    "flavoros-agent-regine-openclaw.service",
]
for needle in runtime_needles:
    if needle not in runtimes_yaml:
        errors.append(f"configs/runtimes.yaml missing {needle!r}")

if errors:
    print("Agent runtime config check failed:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    sys.exit(1)

print("Agent runtime config OK")
PY
