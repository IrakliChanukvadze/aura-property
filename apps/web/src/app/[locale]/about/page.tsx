import { publicSite } from "@/lib/api";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { imageCity, publicTeam } from "@/lib/api";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  const site = await publicSite();
  const copy = { ...t(l), ...site.translations?.[l] };
  return metadata(l, copy.aboutTitle, copy.aboutIntro, "/about");
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const site = await publicSite();
  const d = { ...t(locale), ...site.translations?.[locale] };
  const team = await publicTeam();
  const placeholderLabel = {
    en: "Temporary illustration",
    ka: "დროებითი ილუსტრაცია",
    ru: "Временная иллюстрация",
    he: "איור זמני",
  }[locale];
  return (
    <>
      <section className="section page-section about-intro">
        <p className="eyebrow">AURA / {d.about}</p>
        <h1>{d.aboutTitle}</h1>
        <p className="page-intro">{d.aboutIntro}</p>
      </section>
      <div className="about-image">
        <img src={site.aboutImage || imageCity} alt={`Aura / ${d.about}`} />
      </div>
      <section
        className="section public-team-section"
        id="team"
        aria-labelledby="team-title"
      >
        <h2 id="team-title">{d.team}</h2>
        {team.length === 0 ? (
          <p>{d.teamBody}</p>
        ) : (
          <div className="team-grid">
            {team.map((member) => {
              const copy = member.publicData.translations?.[locale];
              const name = copy?.name || member.name;
              const title =
                copy?.title ||
                member.publicData.title ||
                member.publicData.role;
              const bio = copy?.bio || member.publicData.bio;
              const temporary = member.publicData.photo?.startsWith(
                "/images/team/placeholder-",
              );
              return (
                <article className="team-card" key={member.id}>
                  {member.publicData.photo && (
                    <div className="team-portrait">
                      <img
                        src={member.publicData.photo}
                        alt={temporary ? `${name} — ${placeholderLabel}` : name}
                        width={720}
                        height={840}
                        loading="lazy"
                      />
                      {temporary && (
                        <span className="team-placeholder-label">
                          {placeholderLabel}
                        </span>
                      )}
                    </div>
                  )}
                  <h3>{name}</h3>
                  {title && <p className="team-role">{title}</p>}
                  {bio && <p className="team-bio">{bio}</p>}
                  {member.publicData.phone && (
                    <a href={`tel:${member.publicData.phone}`}>
                      {member.publicData.phone}
                    </a>
                  )}
                  {member.publicData.whatsapp && (
                    <a
                      href={`https://wa.me/${member.publicData.whatsapp.replace(/\D/g, "")}`}
                    >
                      WhatsApp
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
