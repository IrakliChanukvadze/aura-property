import { t } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "./api";
import { Form, Modal, Empty, type Field, currencies } from "./ui";
import "./project-editor.css";
const projectSteps = [
  "Details",
  "Translations",
  "Buildings",
  "Floors",
  "Apartments",
  "Annotations",
  "Review & publish",
];
const locales = ["en", "ka", "ru", "he"] as const;
type ContentLocale = (typeof locales)[number];
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
    [locale, setLocale] = useState<ContentLocale>("en"),
    [step, setStep] = useState(0),
    [translating, setTranslating] = useState(false);
  const translationPending = useRef(false);
  const contentForm = useRef<HTMLFieldSetElement>(null);
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
    setSelected((current: any) =>
      current?.id === selected?.id ? { ...current, ...value } : current,
    );
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
            setStep(0);
            setError("");
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
              setStep(0);
              setError("");
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
          {kind === "projects" && (
            <nav className="project-steps" aria-label="Project setup steps">
              {projectSteps.map((label, index) => (
                <button
                  key={label}
                  disabled={translating || (!selected?.id && index > 0)}
                  aria-current={step === index ? "step" : undefined}
                  onClick={() => {
                    setStep(index);
                    setError("");
                  }}
                >
                  <span>{index + 1}</span>
                  {t(label)}
                </button>
              ))}
            </nav>
          )}
          {(kind === "blogs" || step <= 1) && (
            <>
              <div className="tabs">
                {locales.map((l) => (
                  <button
                    key={l}
                    disabled={translating}
                    onClick={() => setLocale(l)}
                    className={locale === l ? "selected" : ""}
                  >
                    {l.toUpperCase()}{" "}
                    {selected?.translations?.[l]?.reviewed ? "✓" : ""}
                  </button>
                ))}
              </div>
              <fieldset
                ref={contentForm}
                disabled={translating}
                style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
              >
                <Form
                  key={`${selected?.id || "new"}-${locale}`}
                  fields={
                    kind === "projects" && step === 1
                      ? fields.filter(
                          (f) => f.name === "title" || f.name === "description",
                        )
                      : fields
                  }
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
                            slug: v.slug ?? selected?.slug,
                            city: v.city ?? selected?.city,
                            showPrices:
                              v.showPrices === undefined
                                ? (selected?.showPrices ?? true)
                                : v.showPrices === "true",
                            constructionStatus:
                              v.constructionStatus ??
                              selected?.constructionStatus,
                            coverImage: v.coverImage ?? selected?.coverImage,
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
                    if (kind === "projects" && !selected?.id) setStep(1);
                    setError("");
                  }}
                  label={t("Save draft")}
                />
              </fieldset>
            </>
          )}
          {selected?.id && (
            <>
              {(kind === "blogs" || step === 1 || step === 6) && (
                <div className="action-grid">
                  <button
                    disabled={translating}
                    aria-busy={translating}
                    onClick={async () => {
                      if (translationPending.current) return;
                      const key = kind === "blogs" ? "body" : "description";
                      const storedSource =
                        selected.translations?.[locale] || {};
                      const form = contentForm.current?.querySelector("form");
                      // Capture the current inputs before the fieldset is disabled.
                      // The final project review step has no form and uses saved copy.
                      const inputs = form ? new FormData(form) : null;
                      const source = inputs
                        ? {
                            ...storedSource,
                            title: String(inputs.get("title") ?? ""),
                            [key]: String(inputs.get(key) ?? ""),
                          }
                        : storedSource;
                      const sourceChanged =
                        source.title !== storedSource.title ||
                        source[key] !== storedSource[key];
                      translationPending.current = true;
                      setTranslating(true);
                      setError("");
                      try {
                        const result = await api<{
                          fields: {
                            id: string;
                            translations: Record<ContentLocale, string>;
                          }[];
                        }>("/translate/batch", "POST", {
                          sourceLanguage: locale,
                          fields: [
                            { id: "title", text: source?.title, kind: "title" },
                            {
                              id: key,
                              text: source?.[key],
                              kind: "description",
                            },
                          ],
                        });
                        const suggestions = new Map(
                          result.fields.map((field) => [
                            field.id,
                            field.translations,
                          ]),
                        );
                        const translations = {
                          ...selected.translations,
                          [locale]: {
                            ...source,
                            ...(sourceChanged ? { reviewed: false } : {}),
                          },
                        };
                        for (const target of locales.filter(
                          (l) => l !== locale,
                        )) {
                          const title = suggestions.get("title")?.[target];
                          const body = suggestions.get(key)?.[target];
                          if (
                            typeof title !== "string" ||
                            !title.trim() ||
                            typeof body !== "string" ||
                            !body.trim()
                          )
                            throw new Error(
                              "Invalid translation. Your source has not changed.",
                            );
                          translations[target] = {
                            ...translations[target],
                            title,
                            [key]: body,
                            reviewed: false,
                          };
                        }
                        await save({ translations, published: false });
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        translationPending.current = false;
                        setTranslating(false);
                      }
                    }}
                  >
                    {t("Automatically translate")}
                    {translating ? "…" : ""}
                  </button>
                  <button
                    disabled={translating}
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
                    disabled={translating}
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
              )}
              {(kind === "blogs" || step === 1 || step === 6) && (
                <p className="muted">
                  {t(
                    "Publishing requires all four completed, reviewed translations. Editing text saves it as a private draft for review.",
                  )}
                </p>
              )}
              {kind === "projects" && step >= 2 && step <= 5 && (
                <Inventory
                  key={step}
                  mode={projectSteps[step]}
                  project={selected}
                  user={user}
                  onSave={save}
                />
              )}
            </>
          )}
          {kind === "projects" && step === 6 && selected?.id && (
            <section className="project-review">
              <h3>{t("Ready for review")}</h3>
              <p>
                {selected.city} · {selected.buildings?.length || 0} buildings ·{" "}
                {selected.units?.length || 0} apartments
              </p>
              {locales.map((l) => (
                <p key={l}>
                  {l.toUpperCase()}:{" "}
                  {selected.translations?.[l]?.reviewed
                    ? "Reviewed ✓"
                    : "Needs translation review"}
                </p>
              ))}
              <p className="muted">
                Check every building and floor outline before publishing. All
                four languages must be complete and reviewed.
              </p>
            </section>
          )}
          {kind === "projects" && selected?.id && (
            <footer className="project-step-footer">
              <button
                disabled={translating || step === 0}
                onClick={() => setStep(step - 1)}
              >
                {t("Back")}
              </button>
              <span>
                {step + 1} / {projectSteps.length}
              </span>
              <button
                disabled={translating || step === projectSteps.length - 1}
                onClick={() => setStep(step + 1)}
              >
                {t("Next")}
              </button>
            </footer>
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
  mode,
}: {
  mode: string;
  project: any;
  user: any;
  onSave: (p: any) => Promise<any>;
}) {
  const tab = mode === "Apartments" ? "units" : "buildings";
  const [annotationKind, setAnnotationKind] = useState("floors"),
    [error, setError] = useState(""),
    [buildingId, setBuildingId] = useState(project.buildings?.[0]?.id || ""),
    [floorId, setFloorId] = useState(
      project.buildings?.[0]?.floors?.[0]?.id || "",
    ),
    [editingUnit, setEditingUnit] = useState<any>(null),
    [draftPolygon, setDraftPolygon] = useState<number[][]>([]);
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
      <h3>{t(mode)}</h3>
      {mode === "Annotations" && (
        <div className="tabs">
          <button
            className={annotationKind === "floors" ? "selected" : ""}
            onClick={() => setAnnotationKind("floors")}
          >
            {t("Floor outlines on building")}
          </button>
          <button
            className={annotationKind === "units" ? "selected" : ""}
            onClick={() => setAnnotationKind("units")}
          >
            {t("Apartment outlines on floor plan")}
          </button>
        </div>
      )}
      <select
        aria-label={t("Building")}
        value={buildingId}
        onChange={(e) => {
          setBuildingId(e.target.value);
          setFloorId(
            buildings.find((b: any) => b.id === e.target.value)?.floors?.[0]
              ?.id || "",
          );
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
          {mode === "Buildings" && (
            <>
              <div className="project-building-list">
                {buildings.map((b: any) => (
                  <button
                    key={b.id}
                    className={buildingId === b.id ? "selected" : ""}
                    onClick={() => setBuildingId(b.id)}
                  >
                    <img src={mediaUrl(b.coverImage || b.image, true)} alt="" />
                    <strong>{b.name}</strong>
                    <small>{b.floors?.length || 0} floors</small>
                  </button>
                ))}
              </div>
              {building && (
                <details className="project-entity-edit">
                  <summary>Edit selected building</summary>
                  <Form
                    key={building.id}
                    fields={[
                      {
                        name: "name",
                        label: t("Building name"),
                        required: true,
                        value: building.name,
                      },
                      {
                        name: "coverImage",
                        label: t("Building cover image"),
                        type: "upload",
                        value: building.coverImage || building.image,
                      },
                    ]}
                    onSubmit={async (v) => {
                      await saveBuildings(
                        buildings.map((b: any) =>
                          b.id === buildingId
                            ? { ...b, name: v.name, coverImage: v.coverImage }
                            : b,
                        ),
                      );
                    }}
                  />
                </details>
              )}
              <h4>{t("Add building")}</h4>
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
                    { id, name: v.name, coverImage: v.image, floors: [] },
                  ]);
                  setBuildingId(id);
                }}
                label={t("Add building")}
              />
            </>
          )}
          {mode === "Floors" && building && (
            <>
              <div className="project-floor-list">
                {floors.map((f: any) => (
                  <div className="list-row" key={f.id}>
                    <strong>
                      {t("Floor")} {f.number}
                    </strong>
                    <span>
                      {f.polygon?.length >= 3
                        ? "Outline saved"
                        : "Outline needed"}
                    </span>
                  </div>
                ))}
              </div>
              {floor && (
                <details className="project-entity-edit">
                  <summary>Edit selected floor plan</summary>
                  <Form
                    key={floor.id}
                    fields={[
                      {
                        name: "number",
                        label: t("Floor number"),
                        type: "number",
                        required: true,
                        value: floor.number,
                      },
                      {
                        name: "image",
                        label: t("Floor plan image"),
                        type: "upload",
                        value: floor.image || floor.planImage,
                      },
                    ]}
                    onSubmit={async (v) => {
                      await saveBuildings(
                        buildings.map((b: any) =>
                          b.id === buildingId
                            ? {
                                ...b,
                                floors: floors.map((f: any) =>
                                  f.id === floorId
                                    ? {
                                        ...f,
                                        number: Number(v.number),
                                        image: v.image,
                                      }
                                    : f,
                                ),
                              }
                            : b,
                        ),
                      );
                    }}
                  />
                </details>
              )}
              <h4>{t("Add floor")}</h4>
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
                                image: v.planImage,
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
            </>
          )}
          {mode === "Annotations" &&
            annotationKind === "floors" &&
            building &&
            floors.length > 0 && (
              <Annotator
                key={buildingId}
                image={building.coverImage || building.image}
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
          {mode === "Apartments" && floor && (
            <>
              <p className="muted">
                Draw the apartment on the floor plan, complete its outline, then
                save the outline to fill the coordinates below.
              </p>
              <Annotator
                key={`new-${floorId}`}
                image={floor.image || floor.planImage}
                entities={[{ id: "new-apartment", name: "New apartment" }]}
                onSave={async (polygons) =>
                  setDraftPolygon(polygons[0]?.points || [])
                }
              />
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
                    value: draftPolygon.map((p) => p.join(",")).join("; "),
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
            </>
          )}
          {units
            .filter((u: any) => !floorId || u.floorId === floorId)
            .map((u: any) => (
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
      {mode === "Annotations" && annotationKind === "units" && floor && (
        <Annotator
          key={floorId}
          image={floor.image || floor.planImage}
          entities={units
            .filter((u: any) => u.floorId === floorId)
            .map((u: any) => ({ ...u, name: `#${u.number}` }))}
          onSave={async (polygons) => {
            for (const polygon of polygons)
              await api(`/units/${polygon.id}`, "PATCH", {
                polygon: polygon.points,
              });
            await reload();
          }}
        />
      )}
      {mode === "Annotations" &&
        (!building ||
          !floors.length ||
          (annotationKind === "units" && !floor)) && (
          <Empty text="Add a building and floor plan before drawing outlines." />
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
    [polygons, setPolygons] = useState<any[]>(
      entities
        .filter((e) => e.polygon?.length >= 3)
        .map((e) => ({ id: e.id, points: e.polygon })),
    ),
    [target, setTarget] = useState(entities[0]?.id || ""),
    [error, setError] = useState(""),
    [coordinateText, setCoordinateText] = useState("");
  useEffect(() => {
    if (!entities.some((e) => e.id === target))
      setTarget(entities[0]?.id || "");
  }, [entities, target]);
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
        onChange={(e) => {
          setTarget(e.target.value);
          setPoints([]);
          setCoordinateText("");
        }}
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
        <img
          src={mediaUrl(image, true)}
          alt="Plan annotation canvas"
          onError={() =>
            setError(
              "Image could not load. Check the building cover or floor plan URL.",
            )
          }
        />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {polygons.map((p) => (
            <polygon
              key={p.id}
              className={p.id === target ? "annotation-selected" : ""}
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
