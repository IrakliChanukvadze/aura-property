"use client";
import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { type Project, type Unit, money, totalPrice } from "@/lib/api";
import { type Locale, t } from "@/lib/i18n";
import { InquiryForm } from "./InquiryForm";
export function Explorer({
  project,
  locale,
  usdGel,
}: {
  project: Project;
  locale: Locale;
  usdGel?: number;
}) {
  const d = t(locale);
  const [buildingIndex, setBuildingIndex] = useState(0);
  const building = project.buildings[buildingIndex];
  const [floorIndex, setFloorIndex] = useState(0);
  const floor = building?.floors[floorIndex];
  const [unit, setUnit] = useState<Unit | null>(null);
  const [inquire, setInquire] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "GEL">("USD");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [beds, setBeds] = useState("");
  const [only, setOnly] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selectionReady, setSelectionReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bi = Math.max(
      0,
      project.buildings.findIndex((b) => b.id === params.get("building")),
    );
    const selectedBuilding = project.buildings[bi];
    const fi = Math.max(
      0,
      selectedBuilding?.floors.findIndex((f) => f.id === params.get("floor")) ??
        0,
    );
    const selectedUnit = selectedBuilding?.floors[fi]?.units.find(
      (u) => u.id === params.get("unit") && u.status === "AVAILABLE",
    );
    setBuildingIndex(bi);
    setFloorIndex(fi);
    setUnit(selectedUnit || null);
    setSelectionReady(true);
  }, [project.id]);
  useEffect(() => {
    if (!selectionReady || !building || !floor) return;
    const url = new URL(window.location.href);
    url.searchParams.set("building", building.id);
    url.searchParams.set("floor", floor.id);
    if (unit) url.searchParams.set("unit", unit.id);
    else url.searchParams.delete("unit");
    window.history.replaceState(window.history.state, "", url);
  }, [selectionReady, building?.id, floor?.id, unit?.id]);
  useEffect(() => {
    if (unit && !dialog.current?.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [unit]);
  if (!building || !floor) return <p className="notice">{d.loadingPlans}</p>;
  const converted = (u: Unit) =>
    u.priceCurrency === currency
      ? totalPrice(u)
      : usdGel
        ? currency === "GEL"
          ? totalPrice(u) * usdGel
          : totalPrice(u) / usdGel
        : null;
  const matches = (u: Unit) =>
    (!minPrice ||
      (u.showPrice &&
        converted(u) !== null &&
        converted(u)! >= Number(minPrice))) &&
    (!maxPrice ||
      (u.showPrice &&
        converted(u) !== null &&
        converted(u)! <= Number(maxPrice))) &&
    (!minArea || u.area >= Number(minArea)) &&
    (!maxArea || u.area <= Number(maxArea)) &&
    (!beds || u.bedrooms === Number(beds)) &&
    (!only || u.status === "AVAILABLE");
  return (
    <section className="explorer section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {project.city} / {building.name}
          </p>
          <h2>{d.plan}</h2>
        </div>
        <div className="currency-toggle">
          {(["USD", "GEL"] as const).map((c) => (
            <button
              aria-pressed={currency === c}
              className={currency === c ? "active" : ""}
              key={c}
              onClick={() => setCurrency(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="filters">
        <label>
          {d.price} ({currency})
          <div className="range-input">
            <input
              aria-label={d.minimumPrice}
              type="number"
              min="0"
              placeholder={d.minimum}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              aria-label={d.maximumPrice}
              type="number"
              min="0"
              placeholder={d.maximum}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </label>
        <label>
          {d.area} (m²)
          <div className="range-input">
            <input
              aria-label={d.minimumArea}
              type="number"
              min="0"
              placeholder={d.minimum}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
            <input
              aria-label={d.maximumArea}
              type="number"
              min="0"
              placeholder={d.maximum}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
        </label>
        <label>
          {d.bedrooms}
          <select value={beds} onChange={(e) => setBeds(e.target.value)}>
            <option value="">{d.any}</option>
            {[0, 1, 2, 3, 4].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={only}
            onChange={(e) => setOnly(e.target.checked)}
          />
          {d.availableOnly}
        </label>
      </div>
      {project.buildings.length > 1 && (
        <div className="building-tabs">
          {project.buildings.map((b, i) => (
            <button
              className="button"
              key={b.id}
              onClick={() => {
                setBuildingIndex(i);
                setFloorIndex(0);
              }}
              aria-pressed={i === buildingIndex}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
      <div className="explorer-grid">
        <div className="building-preview">
          <img src={building.coverImage} alt={building.name} />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label={`${d.floor} — ${building.name}`}
          >
            {building.floors.map((f, i) => (
              <polygon
                key={f.id}
                points={f.polygon.map((p) => p.join(",")).join(" ")}
                tabIndex={0}
                role="button"
                aria-label={`${d.floor} ${f.number}`}
                aria-pressed={floorIndex === i}
                className={
                  floorIndex === i ? "floor-polygon selected" : "floor-polygon"
                }
                onClick={() => setFloorIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFloorIndex(i);
                  }
                }}
              />
            ))}
          </svg>
          <div className="building-caption">{building.name}</div>
        </div>
        <div className="plan-panel">
          <div className="floor-selector">
            <span>{d.floor}</span>
            {building.floors.map((f, i) => (
              <button
                className={floorIndex === i ? "selected" : ""}
                aria-pressed={floorIndex === i}
                onClick={() => setFloorIndex(i)}
                key={f.id}
              >
                {f.number}
              </button>
            ))}
          </div>
          <div className="floor-plan">
            <img
              src={floor.image}
              alt={`${d.floor} ${floor.number} — apartment floor plan`}
              draggable={false}
            />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label={d.plan}
            >
              {floor.units.map((u) => (
                <g key={u.id}>
                  <polygon
                    points={u.polygon.map((p) => p.join(",")).join(" ")}
                    className={`unit-polygon ${u.status.toLowerCase()} ${matches(u) ? "" : "muted"}`}
                    tabIndex={
                      u.status === "AVAILABLE" && matches(u) ? 0 : undefined
                    }
                    role={
                      u.status === "AVAILABLE" && matches(u)
                        ? "button"
                        : undefined
                    }
                    aria-label={`${u.number}, ${u.area} m², ${d[u.status.toLowerCase() as "available" | "reserved" | "sold"]}`}
                    onClick={() => {
                      if (u.status === "AVAILABLE" && matches(u)) {
                        setUnit(u);
                        setInquire(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        u.status === "AVAILABLE" &&
                        matches(u) &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        e.preventDefault();
                        setUnit(u);
                        setInquire(false);
                      }
                    }}
                  />
                  <text
                    pointerEvents="none"
                    x={
                      u.polygon.reduce((a, p) => a + p[0], 0) / u.polygon.length
                    }
                    y={
                      u.polygon.reduce((a, p) => a + p[1], 0) / u.polygon.length
                    }
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {u.number}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="plan-legend">
            {(["available", "reserved", "sold"] as const).map((s) => (
              <span key={s}>
                <i className={s} />
                {d[s]}
              </span>
            ))}
          </div>
          <div className="apartment-list">
            {floor.units.filter(matches).map((u) => (
              <button
                disabled={u.status !== "AVAILABLE"}
                key={u.id}
                onClick={() => {
                  setUnit(u);
                  setInquire(false);
                }}
              >
                <span>#{u.number}</span>
                <span>
                  {u.area} m² · {u.bedrooms} {d.rooms}
                </span>
                <span>
                  {u.status === "AVAILABLE" && u.showPrice
                    ? money(
                        converted(u) ?? totalPrice(u),
                        converted(u) === null ? u.priceCurrency : currency,
                        locale,
                      )
                    : d[
                        u.status.toLowerCase() as
                          "available" | "reserved" | "sold"
                      ]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="unit-dialog"
        onCancel={() => setUnit(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setUnit(null);
        }}
        aria-labelledby="unit-title"
      >
        {unit && (
          <>
            <button
              className="dialog-close icon-button"
              onClick={() => setUnit(null)}
              aria-label={d.close}
            >
              <X />
            </button>
            <p className="eyebrow">
              {project.translations[locale]?.title} / {d.floor} {floor.number}
            </p>
            <h2 id="unit-title">
              {d.details} #{unit.number}
            </h2>
            <img src={floor.image} alt={d.apartmentPlan} />
            <div className="unit-facts">
              <div>
                <span>{d.totalArea}</span>
                <strong>{unit.area} m²</strong>
              </div>
              <div>
                <span>{d.rooms}</span>
                <strong>{unit.bedrooms}</strong>
              </div>
              <div>
                <span>{d.price}</span>
                <strong>
                  {unit.showPrice
                    ? money(
                        converted(unit) ?? totalPrice(unit),
                        converted(unit) === null
                          ? unit.priceCurrency
                          : currency,
                        locale,
                      )
                    : d.inquire}
                </strong>
              </div>
            </div>
            {unit.showPrice && (
              <p className="subtle">
                {money(
                  (converted(unit) ?? totalPrice(unit)) / unit.area,
                  converted(unit) === null ? unit.priceCurrency : currency,
                  locale,
                )}{" "}
                / m²
              </p>
            )}
            {inquire ? (
              <InquiryForm
                locale={locale}
                projectId={project.id}
                unitId={unit.id}
                demo={project.demo}
              />
            ) : (
              <button
                className="button primary"
                onClick={() => setInquire(true)}
              >
                {d.inquire}
                <ArrowUpRight size={18} />
              </button>
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
