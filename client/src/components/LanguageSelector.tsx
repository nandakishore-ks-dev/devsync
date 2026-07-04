const LANGUAGES = ["javascript", "python", "cpp", "java"];

export default function LanguageSelector({ value, onChange }: { value: string; onChange: (lang: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/10 text-sm rounded px-2 py-1 outline-none"
    >
      {LANGUAGES.map((l) => (
        <option key={l} value={l}>{l}</option>
      ))}
    </select>
  );
}