import RestaurantCard from "./RestaurantCard";

export default function RestaurantGrid({ items, onSelect }) {
  if (!items.length) return <div className="muted">No items.</div>;

  return (
    <div className="grid">
      {items.map((r) => (
        <RestaurantCard key={r.id} r={r} onClick={() => onSelect(r)} />
      ))}
    </div>
  );
}
