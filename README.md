# CS2 - Dump Tracking

Automated dumps of Counter-Strike 2 (app 730) depot content, binary strings, Steam manifests and the S2Dumper schema output.

## Repository layout

| Path         | Contents                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `install/`   | Extracted game files pulled from the tracked Steam depots (scripts, configs, VPK archives selected by `tracked_files.json`, etc). |
| `manifests/` | Raw Steam depot manifests, one file per depot, named `manifest_<depotid>_<manifestid>.txt`.                                       |
| `strings/`   | Output of `strings` run against every `.exe`, `.dll` and `.so` under `install/`. Split into `win64/` and `linuxsteamrt64/`.       |
| `dump/`      | Output of [S2Dumper](https://github.com/Swiftly-Tracker/s2dumper).                                                                |

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
