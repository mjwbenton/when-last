import { useNav } from '../nav/context';
import { AddActionSheet } from './AddActionSheet';
import { CategoriesSheet } from './CategoriesSheet';
import { BackupSheet } from './BackupSheet';
import { RestoreSheet } from './RestoreSheet';

export function SheetRoot() {
  const { sheet } = useNav();
  if (!sheet) return null;

  switch (sheet.kind) {
    case 'add-action':
      return <AddActionSheet />;
    case 'categories':
      return <CategoriesSheet />;
    case 'backup':
      return <BackupSheet />;
    case 'restore':
      return <RestoreSheet />;
  }
}
