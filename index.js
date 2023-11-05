const path = require("path");
const fs = require("fs");
const stream = require("stream");
const { pipeline } = require("stream/promises");
const { execSync } = require("child_process");
const ghostAdmin = require("@tryghost/admin-api");

const adminHost = process.env.GHOST_ADMIN_HOST;
const apiKey = process.env.GHOST_ADMIN_API_KEY;
const protocol = process.env.PLUGIN_INSECURE ? "http" : "https";
const execOpts = process.env.PLUGIN_PATH
  ? { cwd: process.env.PLUGIN_PATH }
  : null;

const url = `${protocol}://${adminHost}`;
const maxRetry = 3;
const backoffTime = 5 * 1000; // 5 seconds

const sh = (cmd) => {
  console.log(`command: ${cmd}`);
  const exec = execSync(cmd, execOpts);
  console.log(`--- SUCCESS`);
  return exec;
};

const api = new ghostAdmin({
  url,
  key: apiKey,
  version: "v5.0",
});

async function logError(err) {
  console.error("[!] Encountered error!");
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
}

async function ping() {
  try {
    const site = await api.site.read();
    console.log({ site });
  } catch (err) {
    // Log error then proceed anyway. We don't really need this info,
    // but giving a chance to properly boot from cold start, if needed.
    logError(err);
    console.error("Proceeding anyway...");
  }
}

async function upload(zipPath) {
  const realPath = path.join(process.env.PLUGIN_PATH || ".", zipPath);
  console.log({ url, zipPath, realPath });

  let retryCount = 0;
  while (true) {
    try {
      console.log(`--> Attempt ${retryCount + 1} of ${maxRetry}.`);
      await api.themes.upload({ file: realPath });
      break;
    } catch (err) {
      logError(err);

      // Maximum retries has been reached.
      if (retryCount >= maxRetry) throw new err();

      console.log(`Retrying in ${backoffTime}ms...`);
      // In the event of Ghost Admin returning 5xx from cold start,
      // give it some chance to boot properly before retrying again.
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
      retryCount++;
    }
  }
}

async function main() {
  try {
    await ping();

    sh("yarn zip");
    const files = sh("ls -a dist/*.zip").toString().trim().split("\n");
    if (files.length !== 1)
      throw new Exception(
        `Expected 1 zip file, found ${files.length}: ${files}`,
      );

    const zipPath = files[0];

    await upload(zipPath);
    console.log(`${zipPath} successfully uploaded.`);
  } catch (err) {
    logError(err);
    process.exit(1);
  }
}

main();
