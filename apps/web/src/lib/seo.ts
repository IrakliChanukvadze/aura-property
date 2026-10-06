import type {Metadata} from 'next';
import {locales,type Locale} from './i18n';
export const origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
export function metadata(locale:Locale,title:string,description:string,path=''):Metadata {return {metadataBase:new URL(origin),title:`${title} | Aura Property`,description,alternates:{canonical:`/${locale}${path}`,languages:Object.fromEntries([...locales.map(l=>[l,`/${l}${path}`]),['x-default',`/en${path}`]])},openGraph:{title:`${title} | Aura Property`,description,url:`/${locale}${path}`,siteName:'Aura Property',locale, type:'website'},robots:{index:true,follow:true}};}
