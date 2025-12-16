import { useEffect, useMemo, useState } from "react";

const RESTAURANT_TYPES = [
  "Parrilla",
  "Bodegón",
  "Pizzería",
  "Hamburguesería",
  "Cafetería",
  "Heladería",
  "Sushi/Japonés",
  "Peruano",
  "Mexicano",
  "Italiano",
  "Asiatico",
  "Bar",
  "Comida Local/Porteño",
  "Otro",
  "Ambulante"
];

function safe(v) {
  return typeof v === "string" ? v : "";
}

export default function RestaurantForm({
  initial,
  onSubmit,
  submitLabel = "Create",
  disabled = false,
}) {
  const init = useMemo(
    () => ({
      name: safe(initial?.name),
      restaurantType: safe(initial?.restaurantType),
      neighborhood: safe(initial?.neighborhood),
      googleMapsUrl: safe(initial?.googleMapsUrl),
      websiteUrl: safe(initial?.websiteUrl),
      notes: safe(initial?.notes),
    }),
    [initial]
  );

  const [form, setForm] = useState(init);

  useEffect(() => {
    setForm(init);
  }, [init]);

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled) return;
    await onSubmit?.(form);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name *
        <input
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Ej: El Preferido"
          disabled={disabled}
          required
        />
      </label>

      <div className="form-grid-2">
        <label>
          Type
          <select
            className="select"
            value={form.restaurantType}
            onChange={(e) => setField("restaurantType", e.target.value)}
            disabled={disabled}
          >
            <option value="">Seleccionar...</option>
            {RESTAURANT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Barrio / Localidad
          <input
            value={form.neighborhood}
            onChange={(e) => setField("neighborhood", e.target.value)}
            placeholder="Ej: Palermo"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="form-grid-2">
        <label>
          Google Maps URL
          <input
            value={form.googleMapsUrl}
            onChange={(e) => setField("googleMapsUrl", e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            disabled={disabled}
          />
        </label>

        <label>
          Sitio web / Socials
          <input
            value={form.websiteUrl}
            onChange={(e) => setField("websiteUrl", e.target.value)}
            placeholder="https://instagram.com/..."
            disabled={disabled}
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Comentarios / recordatorios"
          rows={4}
          disabled={disabled}
        />
      </label>

      <button className="btn-primary" type="submit" disabled={disabled}>
        {submitLabel}
      </button>
    </form>
  );
}
