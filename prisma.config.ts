import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  migrate: {
    async url() {
      return process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
    }
  }
});
