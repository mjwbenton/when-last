export type Category = {
  id: string;
  name: string;
  color: string;
};

export type TrackedAction = {
  id: string;
  name: string;
  logs: number[];
  categoryId: string | null;
};

export type AppState = {
  actions: TrackedAction[];
  categories: Category[];
  backupKey: string;
  lastBackupAt: number | null;
};
