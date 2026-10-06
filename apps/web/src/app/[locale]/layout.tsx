import {notFound} from 'next/navigation';
import {Shell} from '@/components/Shell';
import {isLocale} from '@/lib/i18n';
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <html lang={locale} dir={locale==='he'?'rtl':'ltr'} suppressHydrationWarning><body><Shell locale={locale}>{children}</Shell></body></html>}
