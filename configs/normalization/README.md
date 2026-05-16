# Normalization Configs

Provider normalization configs map provider-native payloads into FlavorOS-native objects.

These configs are migration candidates promoted from intake material and normalized for the FlavorOS 1.5 three-agent model.

Rules:

- preserve source/provider identity,
- preserve write-back references,
- include deterministic idempotency where replay is possible,
- route only to Khadijah, Sinclair, or Regine,
- never store secret values in config files.

