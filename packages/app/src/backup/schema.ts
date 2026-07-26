import { z } from 'zod';
import { BACKUP_KEY_PATTERN } from '../state';

const action = z.object({
  id: z.string(),
  name: z.string(),
  logs: z.array(z.number()),
});

export const appStateSchema = z.object({
  actions: z.array(action),
  backupKey: z.string().regex(BACKUP_KEY_PATTERN),
  lastBackupAt: z.number().nullable(),
});

export type AppStateSnapshot = z.infer<typeof appStateSchema>;
