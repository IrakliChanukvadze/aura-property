import { t } from "./i18n";
import { useEffect, useState } from "react";
import { api, mediaUrl } from "./api";
import { Form, Modal, Empty, type Field, currencies } from "./ui";
const locales = ["en", "ka", "ru", "he"];
export function Content({
  kind,
  user,
}: {
  kind: "projects" | "blogs";
  user: any;
}) {
  const endpoint = kind === "blogs" ? "posts" : "projects";
  const [items, setItems] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [dialog, setDialog] = useState(false),
    [error, setError] = useState(""),
    [locale, setLocale] = useState("en");
  const load = () =>
    api<any[]>(`/${endpoint}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [endpoint]);
  const save = async (body: any) => {
    const value = await api(
      `/${endpoint}${selected?.id ? `/${selected.id}` : ""}`,
      selected?.id ? "PATCH" : "POST",
      body,
    );
    setSelected({ ...selected, ...value });
    await load();
    return value;
  };
  const translated = selected?.translations?.[locale] || {};
  const fields: Field[] =
    kind === "blogs"
      ? [
          {
            name: "title",
            label: t("Title"),
            required: true,
            value: translated.title,
          },
          {
            name: "body",
            label: t("Article body"),
            type: "textarea",
            required: true,
            value: translated.body,
          },
          {
            name: "slug",
            label: t("URL slug"),
            required: true,
            value: selected?.slug,
          },
          {
            name: "publicationDate",
            label: t("Publication date"),
            type: "date",
            value: selected?.publishedAt?.slice(0, 10),
          },
          {
            name: "coverImage",
            label: t("Cover image (optional)"),
            type: "upload",
            purpose: "BLOG",
            value: selected?.coverImage,
          },
        ]
      : [
          {
            name: "title",
            label: t("Project name"),
            required: true,
            value: translated.title,
          },
          {
            name: "slug",
            label: t("URL slug"),
            required: true,
            value: selected?.slug,
          },
          {
            name: "city",
            label: t("City"),
            required: true,
            value: selected?.city,
          },
          {
            name: "showPrices",
            label: t("Public prices"),
            options: [
              { value: "true", label: t("Show prices") },
              { value: "false", label: t("Contact for price") },
            ],
            value: String(selected?.showPrices ?? true),
          },
          {
            name: "constructionStatus",
            label: t("Construction"),
            options: [
              { value: "ONGOING", label: t("Ongoing") },
              { value: "COMPLETED", label: t("Completed") },
            ],
            value: selected?.constructionStatus,
          },
          {
            name: "coverImage",
            label: t("Cover image"),
            type: "upload",
            purpose: "PROJECT",
            required: true,
            value: selected?.coverImage,
          },
          {
            name: "description",
            label: t("Project description"),
            type: "textarea",
            required: true,
            value: translated.description,
          },
        ];
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">
          {t("Private drafts. Thoughtfully reviewed, directly published.")}
        </p>
        <button
          className="primary"
          onClick={() => {
            setSelected(null);
            setDialog(true);
          }}
        >
          {t("＋ New")}
          {kind === "blogs" ? "article" : "project"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="content-grid">
        {items.map((item) => (
          <button
            className="content-card"
            key={item.id}
            onClick={() => {
              setSelected(item);
              setDialog(true);
            }}
          >
            {item.coverImage && (
              <img src={mediaUrl(item.coverImage, true)} alt={""} />
            )}
            <div>
              <span className="badge">
                {item.published ? "Published" : "Draft"}
              </span>
              <h2>{item.translations?.en?.title || item.slug}</h2>
              <p>{item.city || "Journal article"}</p>
            </div>
          </button>
        ))}
      </div>
      {!items.length && (
        <Empty text={`No ${kind} yet. Start with a private draft.`} />
      )}
      {dialog && (
        <Modal
          title={
            selected?.translations?.en?.title ||
            `New ${kind === "blogs" ? "article" : "project"}`
          }
          onClose={() => setDialog(false)}
        >
          <div className="tabs">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={locale === l ? "selected" : ""}
              >
                {l.toUpperCase()}{" "}
                {selected?.translations?.[l]?.reviewed ? "✓" : ""}
              </button>
            ))}
          </div>
          <Form
            key={`${selected?.id || "new"}-${locale}`}
            fields={fields}
            onSubmit={async (v) => {
              const body =
                kind === "blogs"
                  ? {
                      slug: v.slug,
                      coverImage: v.coverImage || null,
                      ...(v.publicationDate
                        ? {
                            publishedAt: new Date(
                              v.publicationDate + "T12:00:00+04:00",
                            ).toISOString(),
                          }
                        : {}),
                      translations: {
                        ...selected?.translations,
                        [locale]: {
                          title: v.title,
                          body: v.body,
                          reviewed: false,
                        },
                      },
                    }
                  : {
                      slug: v.slug,
                      city: v.city,
                      showPrices: v.showPrices === "true",
                      constructionStatus: v.constructionStatus,
                      coverImage: v.coverImage,
                      buildings: selected?.buildings || [],
                      translations: {
                        ...selected?.translations,
                        [locale]: {
                          title: v.title,
                          description: v.description,
                          reviewed: false,
                        },
                      },
                    };
              await save({ ...body, published: false });
              setError("");
            }}
            label={t("Save draft")}
          />
          {selected?.id && (
            <>
              <div className="action-grid">
                <button
                  onClick={async () => {
                    try {
                      const translations = { ...selected.translations };
                      for (const target of locales.filter(
                        (l) => l !== locale,
                      )) {
                        const source = selected.translations[locale];
                        const title = await api("/translate", "POST", {
                          text: source.title,
                          source: locale,
                          target,
                        });
                        const key = kind === "blogs" ? "body" : "description";
                        const body = await api("/translate", "POST", {
                          text: source[key],
                          source: locale,
                          target,
                        });
                        translations[target] = {
                          title: title.text || title.translation,
                          [key]: body.text || body.translation,
                          reviewed: false,
                        };
                      }
                      await save({ translations, published: false });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Automatically translate")}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await save({
                        translations: {
                          ...selected.translations,
                          [locale]: { ...translated, reviewed: true },
                        },
                      });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Confirm")}
                  {locale.toUpperCase()}
                  {t("reviewed")}
                </button>
                <button
                  className="primary"
                  onClick={async () => {
                    try {
                      await save({ published: !selected.published });
                      setDialog(false);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {selected.published
                    ? t("Unpublish to draft")
                    : t("Publish all languages")}
                </button>
              </div>
              <p className="muted">
                {t(
                  "Publishing requires all four completed, reviewed translations. Editing text saves it as a private draft for review.",
                )}
              </p>
              {kind === "projects" && (
                <Inventory project={selected} user={user} onSave={save} />
              )}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
function Inventory({
  project,
  user,
  onSave,
}: {
  project: any;
  user: any;
  onSave: (p: any) => Promise<any>;
}) {
  const [tab, setTab] = useState("buildings"),
    [error, setError] = useState(""),
    [buildingId, setBuildingId] = useState(project.buildings?.[0]?.id || ""),
    [floorId, setFloorId] = useState(""),
    [editingUnit, setEditingUnit] = useState<any>(null);
  const buildings = project.buildings || [],
    building = buildings.find((b: any) => b.id === buildingId),
    floors = building?.floors || [],
    floor = floors.find((f: any) => f.id === floorId),
    units = project.units || [];
  const saveBuildings = async (next: any[]) => {
    await onSave({ buildings: next, published: false });
  };
  const reload = async () => {
    const all = await api<any[]>("/projects");
    const p = all.find((x) => x.id === project.id);
    await onSave({ buildings: p.buildings });
  };
  return (
    <section>
      <h3>{t("Explorer authoring")}</h3>
      <div className="tabs">
        <button onClick={() => setTab("buildings")}>
          {t("Buildings & floors")}
        </button>
        <button onClick={() => setTab("units")}>
          {t("Apartments & prices")}
        </button>
      </div>
      <select
        aria-label={t("Building")}
        value={buildingId}
        onChange={(e) => {
          setBuildingId(e.target.value);
          setFloorId("");
        }}
      >
        <option value={""}>{t("Select building")}</option>
        {buildings.map((b: any) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {building && (
        <select
          aria-label={t("Floor")}
          value={floorId}
          onChange={(e) => setFloorId(e.target.value)}
        >
          <option value={""}>{t("Select floor")}</option>
          {floors.map((f: any) => (
            <option key={f.id} value={f.id}>
              {t("Floor")}
              {f.number}
            </option>
          ))}
        </select>
      )}
      {tab === "buildings" ? (
        <>
          <Form
            fields={[
              { name: "name", label: t("Building name"), required: true },
              {
                name: "image",
                label: t("Building cover image"),
                type: "upload",
                required: true,
              },
            ]}
            onSubmit={async (v) => {
              const id = crypto.randomUUID();
              await saveBuildings([
                ...buildings,
                { id, name: v.name, image: v.image, floors: [] },
              ]);
              setBuildingId(id);
            }}
            label={t("Add building")}
          />
          {building && (
            <Form
              fields={[
                {
                  name: "number",
                  label: t("Floor number"),
                  type: "number",
                  required: true,
                },
                {
                  name: "planImage",
                  label: t("Floor plan image"),
                  type: "upload",
                  required: true,
                },
              ]}
              onSubmit={async (v) => {
                const id = crypto.randomUUID();
                await saveBuildings(
                  buildings.map((b: any) =>
                    b.id === buildingId
                      ? {
                          ...b,
                          floors: [
                            ...floors,
                            {
                              id,
                              number: Number(v.number),
                              planImage: v.planImage,
                              polygon: [],
                            },
                          ],
                        }
                      : b,
                  ),
                );
                setFloorId(id);
              }}
              label={t("Add floor")}
            />
          )}
          {building && floors.length > 0 && (
            <Annotator
              image={building.image}
              entities={floors.map((f: any) => ({
                ...f,
                name: `Floor ${f.number}`,
              }))}
              onSave={async (polygons) => {
                await saveBuildings(
                  buildings.map((b: any) =>
                    b.id === buildingId
                      ? {
                          ...b,
                          floors: floors.map((f: any) => ({
                            ...f,
                            polygon:
                              polygons.find((p) => p.id === f.id)?.points ||
                              f.polygon,
                          })),
                        }
                      : b,
                  ),
                );
              }}
            />
          )}
        </>
      ) : (
        <>
          {!floor && (
            <p className="muted">{t("Select a building and floor first.")}</p>
          )}
          {floor && (
            <>
              <Form
                fields={[
                  {
                    name: "number",
                    label: t("Apartment number"),
                    required: true,
                  },
                  {
                    name: "area",
                    label: t("Total area including balconies (m²)"),
                    type: "number",
                    required: true,
                  },
                  {
                    name: "bedrooms",
                    label: t("Bedrooms"),
                    type: "number",
                    required: true,
                  },
                  {
                    name: "price",
                    label: t("Source price"),
                    type: "number",
                    required: true,
                  },
                  {
                    name: "priceCurrency",
                    label: t("Currency"),
                    options: currencies,
                    value: "USD",
                  },
                  {
                    name: "priceMode",
                    label: t("Entry mode"),
                    options: [
                      { value: "TOTAL", label: t("Total") },
                      { value: "PER_M2", label: t("Per m²") },
                    ],
                  },
                  {
                    name: "polygon",
                    label: t("Apartment corners x,y; x,y; x,y (0–100)"),
                    required: true,
                  },
                ]}
                onSubmit={async (v) => {
                  const polygon = parsePoints(v.polygon);
                  if (polygon.length < 3)
                    throw new Error("At least three corners required");
                  await api(`/projects/${project.id}/units`, "POST", {
                    ...v,
                    polygon,
                    buildingId,
                    floorId,
                    area: Number(v.area),
                    bedrooms: Number(v.bedrooms),
                    price: Number(v.price),
                  });
                  await reload();
                }}
                label={t("Add apartment")}
              />
              <Annotator
                image={floor.planImage}
                entities={units
                  .filter((u: any) => u.floorId === floorId)
                  .map((u: any) => ({ ...u, name: u.number }))}
                onSave={async (polygons) => {
                  for (const p of polygons)
                    await api(`/units/${p.id}`, "PATCH", { polygon: p.points });
                  await reload();
                }}
              />
            </>
          )}
          {units.map((u: any) => (
            <div className="list-row" key={u.id}>
              <div>
                <strong>{u.number}</strong>
                <small>
                  {u.area} m² / {u.status} / {u.price} {u.priceCurrency}
                </small>
              </div>
              <button onClick={() => setEditingUnit(u)}>{t("Edit")}</button>
              {user.role === "SUPER_ADMIN" && (
                <button
                  onClick={async () => {
                    const min = prompt(
                      "Private minimum sale price",
                      u.minimumPrice || "",
                    );
                    if (min === null) return;
                    try {
                      await api(`/units/${u.id}`, "PATCH", {
                        minimumPrice: min.trim() ? Number(min) : null,
                        minimumCurrency: min.trim() ? u.priceCurrency : null,
                      });
                      await reload();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Minimum price")}
                </button>
              )}
            </div>
          ))}
        </>
      )}
      {editingUnit && (
        <Modal
          title={`${t("Apartment")} #${editingUnit.number}`}
          onClose={() => setEditingUnit(null)}
        >
          <Form
            fields={[
              {
                name: "number",
                label: t("Apartment number"),
                required: true,
                value: editingUnit.number,
              },
              {
                name: "area",
                label: t("Total area including balconies (m²)"),
                type: "number",
                required: true,
                value: Number(editingUnit.area),
              },
              {
                name: "bedrooms",
                label: t("Bedrooms"),
                type: "number",
                required: true,
                value: editingUnit.bedrooms,
              },
              {
                name: "price",
                label: t("Source price"),
                type: "number",
                required: true,
                value: Number(editingUnit.price),
              },
              {
                name: "priceCurrency",
                label: t("Currency"),
                options: currencies,
                value: editingUnit.priceCurrency,
              },
              {
                name: "priceMode",
                label: t("Entry mode"),
                options: [
                  { value: "TOTAL", label: t("Total") },
                  { value: "PER_M2", label: t("Per m²") },
                ],
                value: editingUnit.priceMode,
              },
              {
                name: "showPrice",
                label: t("Public prices"),
                options: [
                  { value: "true", label: t("Show prices") },
                  { value: "false", label: t("Contact for price") },
                ],
                value: String(editingUnit.showPrice),
              },
            ]}
            onSubmit={async (values) => {
              await api(`/units/${editingUnit.id}`, "PATCH", {
                ...values,
                area: Number(values.area),
                bedrooms: Number(values.bedrooms),
                price: Number(values.price),
                showPrice: values.showPrice === "true",
              });
              setEditingUnit(null);
              await reload();
            }}
          />
        </Modal>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
function parsePoints(text: string) {
  return text
    .split(";")
    .map((x) => x.trim().split(",").map(Number))
    .filter(
      (x) =>
        x.length === 2 &&
        x.every((v) => Number.isFinite(v) && v >= 0 && v <= 100),
    );
}
function Annotator({
  image,
  entities,
  onSave,
}: {
  image: string;
  entities: any[];
  onSave: (p: any[]) => Promise<void>;
}) {
  const [points, setPoints] = useState<number[][]>([]),
    [polygons, setPolygons] = useState<any[]>([]),
    [target, setTarget] = useState(entities[0]?.id || ""),
    [error, setError] = useState(""),
    [coordinateText, setCoordinateText] = useState("");
  return (
    <div className="annotator">
      <p>
        {t(
          "Choose a region, then place its corners. Normalized coordinates preserve the image’s aspect ratio.",
        )}
      </p>
      <select
        aria-label={t("Region to annotate")}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      >
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <div
        className="annotation-image"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const next = [
            ...points,
            [
              Math.round(((e.clientX - r.left) / r.width) * 10000) / 100,
              Math.round(((e.clientY - r.top) / r.height) * 10000) / 100,
            ],
          ];
          setPoints(next);
          setCoordinateText(next.map((p) => p.join(",")).join("; "));
        }}
      >
        <img src={mediaUrl(image, true)} alt="Plan annotation canvas" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {polygons.map((p, i) => (
            <polygon
              key={i}
              points={p.points.map((x: number[]) => x.join(",")).join(" ")}
            />
          ))}
          <polyline points={points.map((p) => p.join(",")).join(" ")} />
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r=".5" />
          ))}
        </svg>
      </div>
      <p className="muted">
        {t("Keyboard alternative: enter x,y; x,y; x,y below.")}
      </p>
      <input
        aria-label={t("Polygon coordinates")}
        value={coordinateText}
        onChange={(e) => {
          setCoordinateText(e.target.value);
          setPoints(parsePoints(e.target.value));
        }}
      />
      <div className="action-grid">
        <button
          onClick={() => {
            setPoints(points.slice(0, -1));
            setCoordinateText(
              points
                .slice(0, -1)
                .map((p) => p.join(","))
                .join("; "),
            );
          }}
        >
          {t("Undo point")}
        </button>
        <button
          disabled={points.length < 3 || !target}
          onClick={() => {
            setPolygons([
              ...polygons.filter((p) => p.id !== target),
              { id: target, points },
            ]);
            setPoints([]);
            setCoordinateText("");
          }}
        >
          {t("Complete polygon")}
        </button>
        <button
          className="primary"
          disabled={!polygons.length}
          onClick={async () => {
            try {
              await onSave(polygons);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {t("Save annotations")}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
