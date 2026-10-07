"use client";
import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { type Project, type Unit, money, totalPrice } from "@/lib/api";
import { type Locale, t } from "@/lib/i18n";
import { InquiryForm } from "./InquiryForm";
import { ProjectInquiry } from "./ProjectInquiry";
import styles from "./Explorer.module.css";
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
  const apartmentLabel = {
    en: "Apartments",
    ka: "ბინები",
    ru: "Квартиры",
    he: "דירות",
  }[locale];
  const [buildingIndex, setBuildingIndex] = useState(0);
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);
  const buildingLabel = {
    en: "Building",
    ka: "კორპუსი",
    ru: "Корпус",
    he: "בניין",
  }[locale];
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
  const selectFloor = (nextBuilding: number, nextFloor: number) => {
    setBuildingIndex(nextBuilding);
    setFloorIndex(nextFloor);
    setUnit(null);
    setInquire(false);
  };
  const dialog = useRef<HTMLDialogElement>(null);
  const [selectionReady, setSelectionReady] = useState(false);
  const buildingSet = project.buildings.map((b) => b.id).join(",");
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
  }, [project.id, buildingSet]);
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
  // Floor coordinates belong to their source image. Only combine matching covers.
  const imageBuildings = project.buildings
    .map((b, index) => ({ building: b, index }))
    .filter(({ building: b }) => b.coverImage === building.coverImage);
  const needsBuildingSelector = project.buildings.some(
    (b) =>
      b.floors.length > 0 &&
      (b.coverImage !== building.coverImage ||
        !b.floors.some((f) => f.polygon.length >= 3)),
  );
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
    <section className={styles.explorer} aria-label={d.plan}>
      <div className={styles.titlebar}>
        <h1>{d.plan}</h1>
        <div className={styles.titleActions}>
          <ProjectInquiry project={project} locale={locale} />
        </div>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <label>
            {d.price} ({currency})
            <div className={styles.range}>
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
            <div className={styles.range}>
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
          <label className={styles.availableToggle}>
            <input
              type="checkbox"
              checked={only}
              onChange={(e) => setOnly(e.target.checked)}
            />
            {d.availableOnly}
          </label>
        </div>
        <div className={styles.currency}>
          {(["USD", "GEL"] as const).map((c) => (
            <button
              aria-pressed={currency === c}
              key={c}
              onClick={() => setCurrency(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.buildingCard}>
          <div className={styles.buildingImage}>
            <img
              src={building.coverImage}
              alt={imageBuildings.map(({ building: b }) => b.name).join(" · ")}
            />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label={`${buildingLabel} · ${d.floor}`}
            >
              {imageBuildings.flatMap(({ building: b, index: bi }) =>
                b.floors.map((f, fi) => {
                  if (f.polygon.length < 3) return null;
                  const label = `${b.name} · ${d.floor} ${f.number}`;
                  const selected = buildingIndex === bi && floorIndex === fi;
                  return (
                    <polygon
                      key={f.id}
                      points={f.polygon.map((p) => p.join(",")).join(" ")}
                      tabIndex={0}
                      role="button"
                      aria-label={label}
                      aria-pressed={selected}
                      className={`floor-polygon${selected ? " selected" : ""}`}
                      onMouseEnter={() => setHoveredFloor(label)}
                      onMouseLeave={() => setHoveredFloor(null)}
                      onFocus={() => setHoveredFloor(label)}
                      onBlur={() => setHoveredFloor(null)}
                      onClick={() => selectFloor(bi, fi)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectFloor(bi, fi);
                        }
                      }}
                    />
                  );
                }),
              )}
            </svg>
            {hoveredFloor && (
              <span className={styles.floorHint} aria-hidden="true">
                {hoveredFloor}
              </span>
            )}
          </div>
          <div className={styles.floorSelector}>
            <div className={styles.floorContext}>
              {needsBuildingSelector ? (
                <select
                  aria-label={buildingLabel}
                  value={buildingIndex}
                  onChange={(e) => {
                    selectFloor(Number(e.target.value), 0);
                    setHoveredFloor(null);
                  }}
                >
                  {project.buildings.map((b, i) => (
                    <option key={b.id} value={i} disabled={!b.floors.length}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span aria-live="polite">{building.name}</span>
              )}
              <span>{d.floor}</span>
            </div>
            {building.floors.map((f, i) => (
              <button
                className={floorIndex === i ? "selected" : ""}
                aria-pressed={floorIndex === i}
                aria-label={`${building.name} · ${d.floor} ${f.number}`}
                onClick={() => selectFloor(buildingIndex, i)}
                key={f.id}
              >
                {f.number}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.planCard}>
          <div className={styles.planCanvas}>
            <div className="floor-plan">
              {floor.image ? (
                <img
                  src={floor.image}
                  alt={`${d.floor} ${floor.number} — apartment floor plan`}
                  draggable={false}
                />
              ) : (
                <p className="notice">{d.loadingPlans}</p>
              )}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-label={d.plan}
              >
                {floor.units
                  .filter((u) => u.polygon.length >= 3)
                  .map((u) => (
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
                          u.polygon.reduce((a, p) => a + p[0], 0) /
                          u.polygon.length
                        }
                        y={
                          u.polygon.reduce((a, p) => a + p[1], 0) /
                          u.polygon.length
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
          </div>
          <aside className={styles.inventory}>
            <div className={styles.legend}>
              {(["available", "reserved", "sold"] as const).map((s) => (
                <span key={s}>
                  <i className={s} />
                  {d[s]}
                </span>
              ))}
            </div>
            <h3 className={styles.inventoryTitle}>
              {apartmentLabel} ({d.floor} {floor.number})
            </h3>
            <div className={styles.apartmentList}>
              {floor.units.filter(matches).map((u) => (
                <button
                  disabled={u.status !== "AVAILABLE"}
                  key={u.id}
                  onClick={() => {
                    setUnit(u);
                    setInquire(false);
                  }}
                >
                  <span className={styles.unitInfo}>
                    <span className={styles.unitSummary}>
                      <strong>{u.number}</strong>
                      <span>
                        {u.details?.areaKnown === false ? "—" : u.area} m²
                      </span>
                      <span>
                        {u.details?.roomsKnown === false ? "—" : u.bedrooms}{" "}
                        {d.rooms}
                      </span>
                    </span>
                    {u.showPrice && (
                      <span className={styles.unitPrice}>
                        {money(
                          converted(u) ?? totalPrice(u),
                          converted(u) === null ? u.priceCurrency : currency,
                          locale,
                        )}
                      </span>
                    )}
                  </span>
                  <span
                    className={`${styles.status} ${styles[u.status.toLowerCase() as "available" | "reserved" | "sold"]}`}
                  >
                    {
                      d[
                        u.status.toLowerCase() as
                          "available" | "reserved" | "sold"
                      ]
                    }
                  </span>
                </button>
              ))}
            </div>
          </aside>
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
            <div className={styles.unitImages}>
              {(unit.details?.photos?.length
                ? unit.details.photos
                : [floor.image]
              ).map((photo, index) => (
                <img
                  key={`${photo}-${index}`}
                  src={photo}
                  alt={`${d.apartmentPlan} #${unit.number}${index ? ` · ${index + 1}` : ""}`}
                />
              ))}
            </div>
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
