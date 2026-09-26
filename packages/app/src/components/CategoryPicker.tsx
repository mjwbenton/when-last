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
      {categories.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            className={['chip', active && 'active'].filter(Boolean).join(' ')}
            style={active ? { background: c.color, borderColor: c.color } : undefined}
            onClick={() => onChange(c.id)}
          >
            <span
              className="chip-dot"
              style={{ background: active ? '#fff' : c.color }}
              aria-hidden
            />
            {c.name}
          </button>
        );
      })}
      {onCreate && (
        <button type="button" className="chip chip-new" onClick={onCreate}>
          + New
        </button>
      )}
    </div>
  );
}
