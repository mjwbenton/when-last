import { useState } from 'react';
import { useAppState } from '../state';
import { useToast, Sheet, IconButton, Input } from '../ui';
import { useNav } from '../nav/context';

export function CategoriesSheet() {
  const { state, mutators } = useAppState();
  const { closeSheet } = useNav();
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast('That category already exists');
      return;
    }
    mutators.addCategory({ name });
    toast(`Added ${name}`);
    setNewName('');
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setDraft(name);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const name = draft.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    if (
      state.categories.some(
        (c) => c.id !== editingId && c.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      toast('That category already exists');
      return;
    }
    mutators.renameCategory(editingId, name);
    setEditingId(null);
  };

  const remove = (id: string, name: string) => {
    const count = state.actions.filter((a) => a.categoryId === id).length;
    const message = count
      ? `Delete "${name}"? ${count} action${count === 1 ? '' : 's'} will become uncategorized.`
      : `Delete "${name}"?`;
    if (!window.confirm(message)) return;
    mutators.removeCategory(id);
    toast(`Deleted ${name}`);
  };

  const countFor = (id: string) => state.actions.filter((a) => a.categoryId === id).length;

  return (
    <Sheet open title="Categories" onClose={closeSheet}>
      <div className="cat-add">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
          placeholder="New category"
          aria-label="New category name"
        />
        <button type="button" className="cat-inline-add" onClick={add} disabled={!newName.trim()}>
          Add
        </button>
      </div>

      {state.categories.length === 0 ? (
        <div className="history-empty">No categories yet.</div>
      ) : (
        <div className="cat-list">
          {state.categories.map((c) => (
            <div className="cat-row" key={c.id}>
              {editingId === c.id ? (
                <input
                  className="input cat-edit"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  aria-label={`Rename ${c.name}`}
                  autoFocus
                />
              ) : (
                <button type="button" className="cat-name" onClick={() => startEdit(c.id, c.name)}>
                  <span className="cat-name-text">{c.name}</span>
                  <span className="cat-count">{countFor(c.id)}</span>
                </button>
              )}
              <IconButton
                name="trash"
                label={`Delete ${c.name}`}
                onClick={() => remove(c.id, c.name)}
              />
            </div>
          ))}
        </div>
      )}

      <p className="cat-hint">Tap a category name to rename it.</p>
    </Sheet>
  );
}
