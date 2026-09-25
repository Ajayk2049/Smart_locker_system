import fs from "fs";
import path from "path";
import readline from "readline";
import { pino } from "pino";

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logFilePath = path.join(logsDir, "app.log");

const fileDestination = (pino as any).destination({
  dest: logFilePath,
  sync: false,
  mkdir: true,
});

export const loggerConfig = {
  level: "info",
  serializers: {
    req(request: any) {
      return {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
      };
    },
    res(reply: any) {
      return {
        statusCode: reply.statusCode,
      };
    },
    err: (pino as any).stdSerializers?.err,
  },
};

export const loggerStream = (pino as any).multistream([
  // 1. File stream: complete logs with timestamps for error analysis and debugging
  {
    level: "info",
    stream: fileDestination,
  },
  // 2. Terminal stream: clean formatted output via pino-pretty
  {
    level: "info",
    stream: (pino as any).transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,reqId",
        messageFormat: "{msg}",
      },
    }),
  },
]);

// Helper to check if a request path should be silenced from terminal output
export function isSilentTerminalPath(url: string, method: string): boolean {
  if (method === "OPTIONS") return true;
  if (url === "/health" || url === "/api/health") return true;
  return false;
}

/**
 * Prunes the log file so that only entries from the last 24 hours are retained.
 * Reads the existing log file, parses line timestamps, and atomically updates the file.
 */
export async function pruneLogsOlderThan24Hours(): Promise<{ retained: number; pruned: number }> {
  if (!fs.existsSync(logFilePath)) {
    return { retained: 0, pruned: 0 };
  }

  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const tempPath = `${logFilePath}.tmp`;

  let retainedCount = 0;
  let prunedCount = 0;

  try {
    const readStream = fs.createReadStream(logFilePath, { encoding: "utf-8" });
    const writeStream = fs.createWriteStream(tempPath, { encoding: "utf-8" });

    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line || !line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        // Pino timestamps are either unix epoch numbers (e.g. 1790332671939) or ISO strings
        const timeVal = typeof parsed.time === "number" ? parsed.time : new Date(parsed.time).getTime();

        if (timeVal && timeVal >= twentyFourHoursAgo) {
          writeStream.write(line + "\n");
          retainedCount++;
        } else {
          prunedCount++;
        }
      } catch {
        // If line is not JSON (e.g. manual output or corrupted line), retain if written recently
        writeStream.write(line + "\n");
        retainedCount++;
      }
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve());
      writeStream.on("error", reject);
    });

    // Replace old log file with pruned temp file
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, logFilePath);
      fs.unlinkSync(tempPath);
    }

    return { retained: retainedCount, pruned: prunedCount };
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
    return { retained: retainedCount, pruned: prunedCount };
  }
}
