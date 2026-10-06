import {cookies,headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {isLocale} from '@/lib/i18n';
export default async function Page(){const saved=(await cookies()).get('aura-language')?.value;const languages=(await headers()).get('accept-language')?.split(',').map(s=>s.split(';')[0].split('-')[0])||[];redirect(`/${saved&&isLocale(saved)?saved:languages.find(isLocale)||'en'}`);}
