export function Card({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md space-y-3 border">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
