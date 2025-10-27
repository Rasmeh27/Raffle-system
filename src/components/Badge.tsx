export default function Badge({ children, tone="gray"}: { children: React.ReactNode; tone?: "gray"|"green"|"yellow"|"red" }) {
  const m = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  } as const;
  return <span className={`inline-block rounded-full px-2 py-1 text-xs ${m[tone]}`}>{children}</span>
}
