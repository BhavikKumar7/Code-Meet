import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const runProcess = (command, args, options = {}) => {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      cwd: options.cwd,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    // Send input to the program
    if (options.stdin) {
      process.stdin.write(options.stdin);
      process.stdin.end();
    } else {
      process.stdin.end();
    }

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (error) => {
      finish({
        stdout,
        stderr: error.message,
        exitCode: -1,
      });
    });

    process.on("close", (exitCode) => {
      finish({
        stdout,
        stderr,
        exitCode,
      });
    });

    setTimeout(() => {
      if (!finished) {
        process.kill();
        finish({
          stdout,
          stderr: "Execution timed out.",
          exitCode: -1,
        });
      }
    }, options.timeout || 5000);
  });
};


export const executeJava = async (
  code,
  stdin = "",
  fileName = "Main.java",
) => {  const tempDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "codemeet-")
  );

const sourcePath = path.join(tempDirectory, fileName);
  try {
    await fs.writeFile(sourcePath, code, "utf8");

const compileResult = await runProcess(
  "javac",
  [fileName],
      {
        cwd: tempDirectory,
        timeout: 5000,
      }
    );

    if (compileResult.exitCode !== 0) {
      return {
        output: "",
        error: compileResult.stderr,
        executionTime: 0,
      };
    }

    const startTime = Date.now();

const className = path.basename(fileName, ".java");

const runResult = await runProcess(
  "java",
  [className],
  {
    cwd: tempDirectory,
    stdin,
    timeout: 5000,
  }
);

    const executionTime = Date.now() - startTime;

    return {
      output: runResult.stdout,
      error: runResult.stderr,
      executionTime,
    };
  } finally {
    await fs.rm(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
};