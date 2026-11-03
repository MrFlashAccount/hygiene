import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

/** Resolve Windows npm launchers to JavaScript so validation needs no command shell. */
export const resolveValidationCommand = (arguments_, platform, searchPath) => {
  const [command, ...rest] = arguments_;

  if (platform !== "win32" || !/^(?:npm|npx)(?:\.cmd)?$/iu.test(path.basename(command))) {
    return { arguments: rest, file: command };
  }

  const name = path
    .basename(command)
    .replace(/\.cmd$/iu, "")
    .toLowerCase();
  const directories =
    path.dirname(command) === "." ? searchPath.split(";") : [path.dirname(command)];

  for (const directory of directories) {
    if (directory === "") {
      continue;
    }

    // fallow-ignore-next-line security-sink -- The caller selects an executable through argv or PATH; absolute paths are intentional, and name is restricted to npm or npx above.
    const cli = path.resolve(directory, "node_modules", "npm", "bin", `${name}-cli.js`);

    // fallow-ignore-next-line security-sink -- This probes the caller-selected PATH directory, not a confined file namespace; name is restricted to npm or npx above.
    if (existsSync(path.resolve(directory, `${name}.cmd`)) && existsSync(cli)) {
      return { arguments: [cli, ...rest], file: process.execPath };
    }
  }

  throw new Error(`Cannot resolve ${command} to its npm JavaScript launcher.`);
};
