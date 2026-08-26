// Auto-switch Prisma schema provider based on DATABASE_URL
// Runs as part of the postinstall hook on Vercel.
// If DATABASE_URL starts with "postgresql://" → switch to postgresql provider
// If DATABASE_URL starts with "file:" → keep sqlite provider (local dev)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
const dbUrl = process.env.DATABASE_URL ?? "";

function switchProvider(targetProvider: "sqlite" | "postgresql") {
  if (!existsSync(schemaPath)) {
    console.log("[switch-db] schema.prisma not found, skipping");
    return;
  }

  let content = readFileSync(schemaPath, "utf-8");

  // Replace the provider line
  const currentProvider = content.match(/provider\s*=\s*"(sqlite|postgresql)"/)?.[1];

  if (currentProvider === targetProvider) {
    console.log(`[switch-db] Already using ${targetProvider}, no change needed`);
    return;
  }

  content = content.replace(
    /provider\s*=\s*"(sqlite|postgresql)"/,
    `provider = "${targetProvider}"`,
  );

  // For PostgreSQL: add directUrl if not present
  if (targetProvider === "postgresql") {
    if (!content.includes("directUrl")) {
      content = content.replace(
        /url\s*=\s*env\("DATABASE_URL"\)/,
        'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
      );
    }
  } else {
    // For SQLite: remove directUrl
    content = content.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, "");
  }

  writeFileSync(schemaPath, content);
  console.log(`[switch-db] Switched to ${targetProvider}`);
}

// Auto-detect from DATABASE_URL
if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
  console.log("[switch-db] DATABASE_URL is PostgreSQL, switching schema...");
  switchProvider("postgresql");
} else if (dbUrl.startsWith("file:")) {
  console.log("[switch-db] DATABASE_URL is SQLite, ensuring schema is SQLite...");
  switchProvider("sqlite");
} else {
  console.log(`[switch-db] DATABASE_URL not set or unrecognized (${dbUrl.slice(0, 30)}...), keeping SQLite`);
  switchProvider("sqlite");
}
