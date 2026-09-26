import { useState } from 'react';
import { useAppState, uid } from '../state';
import { useToast, Sheet, Field } from '../ui';
import { useNav } from '../nav/context';
import { CategoryPicker } from '../components/CategoryPicker';

export function AddActionSheet() {
  const { state, mutators } = useAppState();
  const { closeSheet } = useNav();
  const toast = useToast();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const trimmed = name.trim();
    mutators.addAction({ name: trimmed, categoryId });
    toast(`Added ${trimmed}`);
    closeSheet();
  };

  const createCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (state.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast('That category already exists');
      return;
    }
    // Pre-generate the id so the new category is selected immediately, before
    // the state update round-trips.
    const id = uid('cat');
    mutators.addCategory({ name: trimmed, id });
    setCategoryId(id);
    setNewCategory('');
    setCreating(false);
  };

  return (
    <Sheet
      open
      title="New action"
      onClose={closeSheet}
      actionLabel="Create"
      actionDisabled={!valid}
      onAction={submit}
    >
      <Field label="Name">
        {({ inputId }) => (
          <input
            id={inputId}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="e.g. Watered plants"
            autoFocus
          />
        )}
      </Field>

      <div className="field">
        <div className="field-label">Category</div>
        <CategoryPicker
          categories={state.categories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setCreating(false);
          }}
          onCreate={() => setCreating(true)}
        />
        {creating && (
          <div className="cat-inline">
            <input
              className="input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createCategory();
                if (e.key === 'Escape') setCreating(false);
              }}
              placeholder="New category"
              aria-label="New category name"
              autoFocus
            />
            <button
              type="button"
              className="cat-inline-add"
              onClick={createCategory}
              disabled={!newCategory.trim()}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
