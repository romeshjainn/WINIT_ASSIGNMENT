interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function Toggle({ checked, onChange, label, activeLabel = 'Active', inactiveLabel = 'Inactive' }: ToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <span className={`text-sm font-medium ${checked ? 'text-green-600' : 'text-gray-500'}`}>
        {checked ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}
