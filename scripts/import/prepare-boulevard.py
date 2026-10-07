"""Prepare a standalone inventory snapshot from the authorized read-only Pini export."""
import json, hashlib, pathlib, subprocess, concurrent.futures
root=pathlib.Path(__file__).resolve().parents[2]
s=json.loads((root/'.local/imports/pini-boulevard-source.json').read_text())
published=[p for p in s['projects'] if p['status']=='published'];ids={p['id'] for p in published}
urls={s['complex']['cover_image_url']}
for p in published:urls.add(p['cover_image_url'])
for f in s['floors']:
 if f['project_id'] in ids:urls.add(f['floor_plan_image_url'])
for u in s['units']:
 if u['project_id'] in ids:urls.update(u.get('photos') or [])
urls.discard(None);urls.discard('')
assets=root/'apps/web/public/images/tbilisi-boulevard';assets.mkdir(parents=True,exist_ok=True)
def download(url):
 if not url.startswith('https://media.pini.ge/'):raise ValueError('Unexpected media host')
 suffix=pathlib.Path(url.split('?')[0]).suffix.lower();name=hashlib.sha256(url.encode()).hexdigest()[:20]+suffix
 path=assets/name
 if not path.exists():subprocess.run(['curl','--fail','--silent','--show-error','--location','--retry','2',url,'-o',str(path)],check=True)
 if path.stat().st_size==0:raise ValueError('Empty asset')
 return url,'/images/tbilisi-boulevard/'+name
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:media=dict(pool.map(download,sorted(urls)))
def poly(value):
 if not value:return []
 if isinstance(value[0],list):value=value[0]
 return [[p['x'],p['y']] if isinstance(p,dict) else p for p in value]
buildings=[];blocks=[];units=[]
for p in published:
 children=[b for b in s['buildings'] if b['project_id']==p['id']]
 if not children:children=[{'id':p['id'],'label':'','project_id':p['id']}]
 blocks.append({'id':p['id'],'name':p['name_en'] or p['name'],'polygon':poly(p['complex_polygon']),'buildingIds':[b['id'] for b in children]})
 for b in children:
  floors=[f for f in s['floors'] if f['project_id']==p['id'] and (f['building_id']==b['id'] or f['building_id'] is None)]
  buildings.append({'id':b['id'],'name':(p['name_en'] or p['name'])+' / '+b['label'],'coverImage':media.get(p['cover_image_url'],''),'sourceBlockId':p['id'],'floors':[{'id':f['id'],'number':f['floor_number'],'image':media.get(f['floor_plan_image_url'],''),'polygon':poly(f['polygon']),'sourceData':f} for f in floors]})
  for f in floors:
   for u in [u for u in s['units'] if u['floor_id']==f['id']]:
    details={**u,'photos':[media[x] for x in u.get('photos') or []],'areaKnown':u['area_m2'] is not None,'roomsKnown':u['rooms'] is not None,'priceKnown':u['price'] is not None}
    units.append({'id':u['id'],'buildingId':b['id'],'floorId':f['id'],'number':u['unit_identifier'],'area':u['area_m2'] or 0,'bedrooms':u['rooms'] or 0,'polygon':poly(u['polygon']),'status':u['status'].upper(),'price':u['price'] or 0,'priceCurrency':u['currency'],'priceMode':'TOTAL','showPrice':u['price'] is not None,'details':details})
c=s['complex'];translations={l:{'title':c[name] or c['name'],'description':c[description] or c['description'],'reviewed':True} for l,name,description in [('ka','name','description'),('en','name_en','description_en'),('ru','name_ru','description_ru')]}
translations['he']={'title':translations['en']['title'],'description':translations['en']['description'],'reviewed':False,'fallbackLocale':'en'}
project={'id':'pini-boulevard-copy','slug':'tbilisi-boulevard','city':c['city'],'coverImage':media[c['cover_image_url']],'constructionStatus':'ONGOING','published':True,'translations':translations,'buildings':buildings,'metadata':{'source':'Pini authorized standalone copy','sourceComplexId':c['id'],'copiedAt':s['exportedAt'],'blocks':blocks,'sourceComplex':c,'sourceBlocks':published,'sourceImages':s['images'] or [],'missingHebrewTranslation':True}}
assert len(units)==len([u for u in s['units'] if u['project_id'] in ids]),'Inventory mapping lost apartments'
output=root/'packages/database/prisma/imports/tbilisi-boulevard.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps({'project':project,'units':units,'mediaManifest':media},ensure_ascii=False,indent=2))
print(json.dumps({'buildings':len(buildings),'floors':sum(len(b['floors']) for b in buildings),'units':len(units),'media':len(media),'assetBytes':sum(p.stat().st_size for p in assets.iterdir())}))
