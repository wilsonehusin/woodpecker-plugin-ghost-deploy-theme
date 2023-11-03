const path = require("path");
const fs = require("fs");
const stream = require("stream");
const { pipeline } = require("stream/promises");
const { execSync } = require("child_process");
const ghostAdmin = require("@tryghost/admin-api");

const adminHost = process.env.PLUGIN_ADMIN_HOST;
const apiKey = process.env.PLUGIN_API_KEY;
const protocol = process.env.PLUGIN_INSECURE ? "http" : "https";
const execOpts = process.env.PLUGIN_PATH
  ? { cwd: process.env.PLUGIN_PATH }
  : null;

const url = `${protocol}://${adminHost}`;

const sh = (cmd) => {
  console.log(`command: ${cmd}`);
  const exec = execSync(cmd, execOpts);
  console.log(`--- SUCCESS`);
  return exec;
};

async function main() {
  try {
    sh("yarn zip");
    const files = sh("ls -a dist/*.zip").toString().trim().split("\n");
    if (files.length !== 1)
      throw new Exception(
        `Expected 1 zip file, found ${files.length}: ${files}`,
      );

    const zipPath = files[0];

    console.log({ url, zipPath });
    const api = new ghostAdmin({
      url,
      key: apiKey,
      version: "v5.0",
    });
    await api.themes.upload({
      file: path.join(process.env.PLUGIN_PATH || ".", zipPath),
    });
    console.log(`${zipPath} successfully uploaded.`);
  } catch (err) {
    console.error("Encountered error!");
    const str = JSON.stringify(
      {
        ...err,
        output: err?.output?.map((e) => e?.toString()),
        stdout: err?.stdout?.toString(),
        stderr: err?.stderr?.toString(),
      },
      null,
      2,
    );
    const msg = str === "{}" ? err : str;
    console.error(msg);
    process.exit(1);
  }
}

main();
