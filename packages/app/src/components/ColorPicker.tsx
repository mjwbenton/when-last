import { CATEGORY_COLORS } from '../state';

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="swatches" role="group" aria-label="Category colour">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          className={['swatch', value === c.value && 'active'].filter(Boolean).join(' ')}
          style={{ background: c.value }}
          aria-label={c.name}
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  );
}
