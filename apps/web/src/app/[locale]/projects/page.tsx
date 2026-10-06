import {projects} from '@/lib/api';
import {isLocale,t} from '@/lib/i18n';
import {ProjectCard} from '@/components/Cards';
import {metadata} from '@/lib/seo';
import {notFound} from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return metadata(isLocale(locale)?locale:'en','Projects','Explore residential complexes in Georgia.','/projects');}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();const list=await projects();const d=t(locale);return <section className="section page-section"><p className="eyebrow">AURA / COLLECTION</p><h1>{d.projects}</h1><p className="page-intro">{d.collectionBody}</p>{list.some(p=>p.demo)&&<p className="demo-label">{d.demo}</p>}<div className="projects-grid">{list.map((p,i)=><ProjectCard key={p.id} project={p} locale={locale} index={i}/>)}</div>{!list.length&&<p className="notice">{d.noProjects}</p>}</section>}
