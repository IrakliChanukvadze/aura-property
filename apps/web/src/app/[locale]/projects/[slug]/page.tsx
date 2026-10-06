import Link from 'next/link';
import {notFound} from 'next/navigation';
import {project,exchangeRate} from '@/lib/api';
import {isLocale,t} from '@/lib/i18n';
import {Explorer} from '@/components/Explorer';
import {InquiryForm} from '@/components/InquiryForm';
import {metadata} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;const p=await project(slug);if(!p)return {};const l=isLocale(locale)?locale:'en';return metadata(l,p.translations[l]?.title||p.translations.en.title,p.translations[l]?.description||'',`/projects/${slug}`);}
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;if(!isLocale(locale))notFound();const p=await project(slug);if(!p)notFound();const d=t(locale);const rate=await exchangeRate();return <><section className="project-hero"><img src={p.coverImage} alt={p.translations[locale].title}/><div><Link href={`/${locale}/projects`}>{d.back}</Link><p className="eyebrow">{p.city} / {p.constructionStatus==='COMPLETED'?d.completed:d.ongoing}</p><h1>{p.translations[locale].title}</h1></div></section><section className="project-intro section"><p>{p.translations[locale].description}</p>{p.demo&&<p className="demo-label">{d.demo}</p>}{p.soldOut?<Link className="button primary" href={`/${locale}/projects`}>{d.explore}</Link>:<a className="button primary" href="#inquiry">{d.inquire}</a>}</section><Explorer project={p} locale={locale} usdGel={rate?.usdGel}/>{!p.soldOut&&<section id="inquiry" className="section inquiry-section"><div><p className="eyebrow">YOUR NEXT STEP</p><h2>{d.inquire}</h2><p>{d.contactBody}</p></div><InquiryForm locale={locale} projectId={p.id} demo={p.demo}/></section>}</>}
