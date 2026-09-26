import { z } from 'zod';
import { BACKUP_KEY_PATTERN } from '../state';

const category = z.object({
  id: z.string(),
  name: z.string(),
});

const action = z.object({
  id: z.string(),
  name: z.string(),
  logs: z.array(z.number()),
  // Defaults keep pre-category snapshots restorable.
  categoryId: z.string().nullable().default(null),
});

export const appStateSchema = z.object({
  actions: z.array(action),
  categories: z.array(category).default([]),
  backupKey: z.string().regex(BACKUP_KEY_PATTERN),
  lastBackupAt: z.number().nullable(),
});

export type AppStateSnapshot = z.infer<typeof appStateSchema>;
