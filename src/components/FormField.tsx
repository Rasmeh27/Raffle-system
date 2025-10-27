type Props = {
  label: string;
  children: React.ReactNode;
  error?: string;
};
export default function FormField({ label, children, error }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
