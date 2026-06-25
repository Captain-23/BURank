export default function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b" style={{ borderColor: "var(--bu-border)" }}>
          <td className="px-6 py-4">
            <div className="skeleton h-5 w-6" />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-4 w-32" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="skeleton h-4 w-16" />
          </td>
          <td className="px-6 py-4">
            <div className="skeleton h-4 w-16" />
          </td>
          <td className="px-6 py-4">
            <div className="flex gap-3">
              <div className="skeleton h-4 w-8" />
              <div className="skeleton h-4 w-8" />
              <div className="skeleton h-4 w-8" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="skeleton h-4 w-16" />
          </td>
          <td className="px-6 py-4">
            <div className="skeleton h-4 w-20" />
          </td>
        </tr>
      ))}
    </>
  );
}
