# CS2 - Dump Tracking

Automated dumps of Counter-Strike 2 (app 730) depot content, binary strings, reconstructed protobuf schemas, Steam manifests and the S2Dumper schema output.

## Repository layout

| Path         | Contents                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `install/`   | Extracted game files pulled from the tracked Steam depots (scripts, configs, VPK archives selected by `tracked_files.json`, etc).                                         |
| `manifests/` | One file per build, named `manifest_<patchversion>_<serverversion>_<sourcerevision>.txt`.                                                                                 |
| `strings/`   | Output of [`strings`](https://github.com/Swiftly-Tracker/strings) run against every `.exe`, `.dll` and `.so` under `install/`. Split into `win64/` and `linuxsteamrt64/`. |
| `protobufs/` | `.proto` schemas reconstructed from every `.dll` under `install/` via [ProtoDump](https://github.com/Swiftly-Tracker/ProtoDump).                                          |
| `dump/`      | Output of [S2Dumper](https://github.com/Swiftly-Tracker/s2dumper).                                                                                                        |

## protobufs/ layout

```
protobufs/
├── all/                # every discovered proto, deduplicated across all binaries
│   ├── netmessages.proto
│   └── ...
├── client/             # protos first found in client.dll
│   ├── usercmd.proto
│   └── ...
└── engine2/
    └── ...
```

One subfolder per source `.dll` (schemas first discovered there), plus `all/` with everything deduplicated.

## dump/ files

| File                  | Contents                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `commands.json`       | JSON file describing each command's name, registration module, flags, description and attributes.                                     |
| `convars.json`        | JSON file describing each convar's name, registration module, flags, description, default value and attributes.                       |
| `datamaps.json`       | JSON file describing each schema class's data members, input (with type) and output functions, but also think functions.              |
| `entities.json`       | JSON file describing a list of entity classes registered in the game, showing their Schema name, Designer name and also entity flags. |
| `interfaces.txt`      | A list of interfaces queried by all modules while the dumper was running.                                                             |
| `sdk.json`            | JSON file describing the schema description of all classes and enums registered.                                                      |
| `think_functions.txt` | A list of all of the think functions that were registered.                                                                            |
