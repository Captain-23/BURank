interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: Props) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: "var(--bu-card)", borderColor: "var(--bu-border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--bu-sub)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--bu-sub)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
