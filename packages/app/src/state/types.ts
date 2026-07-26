export type TrackedAction = {
  id: string;
  name: string;
  logs: number[];
};

export type AppState = {
  actions: TrackedAction[];
  backupKey: string;
  lastBackupAt: number | null;
};
