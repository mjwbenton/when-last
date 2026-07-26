import { useState } from 'react';
import { useAppState } from '../state';
import { useToast, Sheet, Field } from '../ui';
import { useNav } from '../nav/context';

export function AddActionSheet() {
  const { mutators } = useAppState();
  const { closeSheet } = useNav();
  const toast = useToast();

  const [name, setName] = useState('');

  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const trimmed = name.trim();
    mutators.addAction({ name: trimmed });
    toast(`Added ${trimmed}`);
    closeSheet();
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
    </Sheet>
  );
}
