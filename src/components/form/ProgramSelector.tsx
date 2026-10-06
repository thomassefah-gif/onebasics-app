/**
 * ProgramSelector — checkboxes for selecting which programs apply to an individual.
 *
 * Renders four labeled checkboxes (Staff, Hedzole, Volunteer, CDL Student).
 * Each toggle calls `onChange` with the updated programs object so the parent
 * wizard can add or remove the corresponding form step and discard any data
 * entered for unchecked programs.
 *
 * Requirements: 6.1–6.7
 */

interface Programs {
  staff: boolean;
  hedzole: boolean;
  volunteer: boolean;
  cdl: boolean;
}

interface ProgramSelectorProps {
  value: Programs;
  onChange: (programs: Programs) => void;
}

const PROGRAM_OPTIONS: { key: keyof Programs; label: string; description: string }[] = [
  {
    key: 'staff',
    label: 'Staff',
    description: 'Employment and staff profile data',
  },
  {
    key: 'hedzole',
    label: 'Hedzole',
    description: 'Hedzole membership and education data',
  },
  {
    key: 'volunteer',
    label: 'Volunteer',
    description: 'Volunteer availability and skills data',
  },
  {
    key: 'cdl',
    label: 'CDL Student',
    description: 'CDL cohort, certificates, and background data',
  },
];

/**
 * ProgramSelector
 *
 * @param value   - Current program selection state
 * @param onChange - Callback invoked with the updated programs object on each toggle
 */
export default function ProgramSelector({ value, onChange }: ProgramSelectorProps) {
  function handleToggle(key: keyof Programs) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <fieldset className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <legend className="px-2 text-sm font-semibold text-purple-900">
        Programs
      </legend>
      <p className="mb-3 text-xs text-purple-700">
        Select all programs that apply. Only the relevant steps will be shown.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROGRAM_OPTIONS.map(({ key, label, description }) => {
          const id = `program-${key}`;
          const checked = value[key];

          return (
            <label
              key={key}
              htmlFor={id}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                checked
                  ? 'border-purple-500 bg-white shadow-sm'
                  : 'border-purple-100 bg-white hover:border-purple-300',
              ].join(' ')}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(key)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-purple-700"
                aria-describedby={`${id}-desc`}
              />
              <div>
                <span
                  className={[
                    'block text-sm font-medium',
                    checked ? 'text-purple-900' : 'text-gray-700',
                  ].join(' ')}
                >
                  {label}
                </span>
                <span
                  id={`${id}-desc`}
                  className="block text-xs text-gray-500"
                >
                  {description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
