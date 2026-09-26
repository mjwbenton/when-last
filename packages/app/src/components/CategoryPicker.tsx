import type { Category } from '../state';

type Props = {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** When provided, renders a trailing "+ New" chip. */
  onCreate?: () => void;
};

export function CategoryPicker({ categories, value, onChange, onCreate }: Props) {
  return (
    <div className="chips" role="group" aria-label="Category">
      <button
        type="button"
        className={['chip', value === null && 'active'].filter(Boolean).join(' ')}
        onClick={() => onChange(null)}
      >
        None
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={['chip', value === c.id && 'active'].filter(Boolean).join(' ')}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
      {onCreate && (
        <button type="button" className="chip chip-new" onClick={onCreate}>
          + New
        </button>
      )}
    </div>
  );
}
