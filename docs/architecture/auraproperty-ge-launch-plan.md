# auraproperty.ge — გაშვების გეგმა

თარიღი: 2026-10-08. დომენი შეძენილია. ეს არის გაშვების მომზადება და რეკომენდაცია; სერვერი არ შეძენილა, DNS არ შეცვლილა და პროდაქშენზე არაფერი ატვირთულა.

## რეკომენდაცია და ბიუჯეტი

ამ ეტაპზე რეკომენდებულია **DigitalOcean-ის ცალკე Aura Droplet, 4 GB RAM / 2 vCPU — $24/თვე**, Cloudflare DNS/TLS და R2-ით. არსებული TypeScript/Node არქიტექტურა ამისთვის გამოდგება. Pini-ს სერვერის ან ბაზის გაზიარება პირველი გაშვებისთვის არ იგეგმება: ორივე პროექტის განახლება და შესაძლო შეფერხება ერთმანეთისგან დამოუკიდებელი უნდა იყოს.

DigitalOcean-ის მიმდინარე Regular Basic პაკეტებია $18 — 2 GB/2 vCPU და $24 — 4 GB/2 vCPU. $18-ით დაწყება შესაძლებელია დაბალი დატვირთვისას, მაგრამ Next.js, API/ფონური სამუშაოები და PostgreSQL ერთ 2 GB სერვერზე რესურსის გაზომვას მოითხოვს. ჩემი არჩევანია დამატებით $6 მეხსიერებისთვის. ეს ზომის შეფასებაა, არა დატვირთვის ტესტით დადასტურებული ტევადობა. Build-ები CI-ში კეთდება და სერვერზე მზა image მიეწოდება. [ოფიციალური ფასები](https://www.digitalocean.com/pricing/droplets)

| კომპონენტი | რეკომენდებული საწყისი თვიური ხარჯი | პირობა |
| --- | ---: | --- |
| DigitalOcean Droplet | $24 | 4 GB RAM, 2 vCPU, ცალკე Aura |
| Droplet-ის ყოველკვირეული backup | $4.80 | სერვერის ფასის 20%; ყოველდღიური ვარიანტი 30% ანუ $7.20 |
| PostgreSQL | ცალკე გადასახადის გარეშე | საკუთარ Droplet-ზე, persistent volume; ადმინისტრირება და backup ჩვენზეა |
| Cloudflare DNS/CDN | Free გეგმა | ფასიან გეგმაზე გადასვლა საჭიროების მიხედვით |
| R2 ფაილები და გარე backup-ები | $0–3 საწყისი რეზერვი | გამოყენების შეფასება; უფასო კვოტისა და ოპერაციების ლიმიტებში შესაძლებელია $0 |
| AI თარგმნა | $5–10 საწყისი ბიუჯეტი | მოხმარების ბიუჯეტია, არა ფიქსირებული გამოწერა ან გარანტირებული ხარჯი |
| ტრანზაქციული email | შესაძლო უფასო კვოტა | მაგალითად Resend; რეალური მოცულობა და provider-ის ლიმიტები შესამოწმებელია |
| SMS OTP | ცალკე, გამოყენების მიხედვით | GE/RU/IL ნომრებზე ტარიფი და მიწოდება შერჩეული პროვაიდერით უნდა დადასტურდეს |

შესაბამისად, **დაახლოებით $35–45/თვე + SMS**, გადასახადებისა და დომენის წლიური განახლების გარეშე, არის პრაქტიკული საწყისი ბიუჯეტი. $18 სერვერით ანალოგიური შეფასება დაახლოებით $27–35 + SMS იქნება. AI/ფაილების რეალური ხარჯი შეიძლება რეზერვზე ნაკლები იყოს. CI/registry/monitoring-ის ფასიანი ლიმიტების გადაჭარბება დამატებითი ხარჯია.

[DigitalOcean backup-ის ფასები](https://docs.digitalocean.com/products/backups/details/pricing/) · [R2: 10 GB Standard storage უფასო კვოტა და ოპერაციების ფასები](https://developers.cloudflare.com/r2/pricing/) · [Resend-ის გეგმები და დღიური ლიმიტები](https://resend.com/pricing)

Railway უფრო მოსახერხებელია deploy-ების, logs-ისა და rollback-ის სამართავად, როცა სერვერის OS/Docker მოვლა არ გვინდა. Pro ამჟამად $20 მინიმალური მოხმარებაა, რომელიც $20 რესურსის კრედიტს მოიცავს; ზედმეტი მოხმარება ემატება და ეს სრული აპის ფიქსირებული ფასი არ არის. Aura-სთვის $30–60 compute-ის დაგეგმვითი რეზერვი განვიხილავდი, მაგრამ ზუსტი თანხა გაზომილი CPU/RAM/storage/traffic-ით დგინდება. დაბალი, პროგნოზირებადი ბიუჯეტისა და DigitalOcean-ის არსებული გამოცდილების გამო ახლა Droplet-ს ვარჩევ. Railway-ზე იგივე web/API/admin/PostgreSQL განაწილება შესაძლებელია; მონაცემთა ბაზის backup და restore იქაც უნდა გავმართოთ და გადავამოწმოთ. [Railway pricing](https://railway.com/pricing) · [Railway PostgreSQL](https://docs.railway.com/databases/postgresql) · [Railway backup schedules](https://docs.railway.com/volumes/backups)

თუ მომავალში ბაზის მოვლის შემცირება გვინდა, DigitalOcean Managed PostgreSQL-ის მიმდინარე საწყისი ცხრილი $15.15/თვეს აჩვენებს; საბოლოო დისკისა და კვანძების კონფიგურაცია შეკვეთამდე უნდა შემოწმდეს. ეს იქნება დამატებითი ხარჯი და ცალკე მიგრაცია. [Managed database ფასები](https://www.digitalocean.com/pricing/managed-databases)

## მისამართები და კომპონენტები

| მისამართი | დანიშნულება |
| --- | --- |
| `https://auraproperty.ge` | Next.js საჯარო საიტი; `/en`, `/ka`, `/ru`, `/he` |
| `https://www.auraproperty.ge` | მუდმივი გადამისამართება ძირითად დომენზე |
| `https://admin.auraproperty.ge` | Vite ადმინი, ინდექსაციის აკრძალვით |
| `https://api.auraproperty.ge/api` | Fastify API; backend-ის ფონური სამუშაოებიც მუდმივად მუშაობს |
| კერძო Docker ქსელი | PostgreSQL და შიდა app პორტები, ინტერნეტში გახსნის გარეშე |
| კერძო R2 bucket | ატვირთული ფოტოები/გეგმები და ავტორიზებული დოკუმენტები; ცალკე backup bucket |

Cloudflare → HTTPS reverse proxy → web/API/admin კონტეინერები. Caddy ან nginx გამოიყენება TLS/route-ებისთვის. PostgreSQL მხოლოდ შიდა ქსელშია. თავდაპირველად API-ის ერთი მუდმივად ჩართული instance მუშაობს; scale-to-zero/sleep არ გამოიყენება, რადგან შეხსენებები და ჯავშნების მონიტორინგი მასზეა დამოკიდებული.

API-ის cookie არის Secure/HttpOnly/SameSite=Strict და host-only. Admin და API უნდა იყვნენ იმავე `auraproperty.ge` საიტის HTTPS ქვედომენებზე; სხვადასხვა პროვაიდერის დროებითი დომენების შერევამ შეიძლება ავტორიზაცია დააზიანოს. `ALLOWED_ORIGINS` ზუსტად ჩაიწერება, wildcard-ის გარეშე.

Cloudflare-ზე საჭიროა დომენის დამატება და რეგისტრატორთან nameserver-ების შეცვლა, არსებული MX/TXT ჩანაწერების შენარჩუნებით. TLS რეჟიმი იქნება **Full (strict)** მას შემდეგ, რაც origin-ზე მოქმედი შესაბამისი სერტიფიკატი დამონტაჟდება. API/admin/private uploads არ უნდა მოხვდეს საჯარო cache-ში; პირველ ეტაპზე დინამიკური HTML და public inventory API-ც uncached დარჩება, რომ CMS/გაყიდული სტატუსი დაუყოვნებლივ განახლდეს. [Cloudflare დომენის დამატება](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/) · [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)

## ანგარიშები და საჭირო წვდომები

1. **რეგისტრატორი:** `auraproperty.ge` nameserver/DNS მართვის წვდომა. შეძენილი დომენის ხელახლა ყიდვა საჭირო არ არის.
2. **DigitalOcean:** Aura პროექტი, შერჩეული Droplet-ის ბიუჯეტის დადასტურება და SSH public key. ხელით dashboard-ით მართვისთვის API key აუცილებელი არ არის.
3. **Cloudflare:** Aura zone; DNS-ის ავტომატიზაციის შემთხვევაში მხოლოდ ამ zone-ზე შეზღუდული DNS Edit token. Global API key არ გვჭირდება.
4. **R2:** account ID, bucket, access key ID და secret; მხოლოდ საჭირო bucket-ის object read/write უფლება. საჯარო bucket არ გვჭირდება — არსებული API წყვეტს რომელი media არის გამოქვეყნებული და რომელი დოკუმენტი კერძოა. [R2 credentials](https://developers.cloudflare.com/r2/api/tokens/)
5. **OpenRouter AI (განახლებულია 2026-10-08, D-233):** ვიყენებთ Pini-ს პროვაიდერს და თარგმნის მიდგომას: `OPENROUTER_API_KEY`, `CHAT_MODEL=google/gemini-2.5-flash` (Pini-ს ლოკალური კონფიგურაციით; production მოდელი ცალკე გადასამოწმებელია). იგივე ანგარიშით billing ერთიანია; იგივე key-ის გამოყენებისას მოხმარებაც და ლიმიტიც ორივე აპისთვის საერთო იქნება. მფლობელმა დაადასტურა იგივე key-ის გამოყენება Pini-სთან ერთად; ლიმიტი ორივეს ერთობლივ მოხმარებას შეეხება. მფლობელი თავად მოგვაწვდის key-ს დაცულ env-ში. მფლობელმა აირჩია $10/თვე Pini-სა და Aura-ს ერთობლივი მოხმარებისთვის; OpenRouter dashboard-ში დაყენდა და გადამოწმდა 2026-10-08 (ადრე იყო $10/კვირა). გამოიყენება structured function output, 60-წამიანი timeout, retry-ის გარეშე და ოთხი ენა, რედაქტორის გადამოწმებით. OpenAI დარჩება სურვილისამებრ ალტერნატივად, ახალი OpenAI key აუცილებელი აღარ არის. [OpenRouter tool calling](https://openrouter.ai/docs/guides/features/tool-calling) · [key-ის თვიური ლიმიტი](https://openrouter.ai/docs/api/api-reference/api-keys/create-a-new-api-key)
6. **Email (Resend, Pini-ს მსგავსად):** `RESEND_API_KEY` და `EMAIL_FROM="Aura Property <notifications@auraproperty.ge>"`; Aura-ს domain verification და Resend-ის მიერ მოცემული DNS ჩანაწერები. იგივე ანგარიშის გამოყენება შეიძლება; არსებული key უნდა მოიცავდეს Aura-ს დომენსაც. Pini-ს გამომგზავნი არ იცვლება. მომხმარებლის `hello@...` mailbox ცალკე არჩევანია; ტრანზაქციული email სერვისი mailbox არ არის. მოწვევებისა და პაროლის აღდგენის direct adapter ემატება AURA-029-ში; რეალური გაგზავნა მხოლოდ დამტკიცებულ მისამართზე შემოწმდება. [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
7. **SMS:** პროვაიდერი, რომელსაც შეუძლია სამიზნე ქვეყნების ნომრებზე OTP მიწოდება; ანგარიშის/გამგზავნის დადასტურება, ტარიფები და წვდომა. განმეორებით მოთხოვნაზე OTP უკვე ბიზნესწესია და პროდაქშენზე გამორთვით არ იცვლება.
8. **პირველი SuperAdmin:** შენი რეალური email და სახელი მოწვევისთვის. საწარმოო პაროლს თავად დააყენებ. Demo ანგარიშები და ადგილობრივი საერთო პაროლი არ გადაიტანება.

გასაღებები/პაროლები არ უნდა მოხვდეს Git-ში, ჩატში, screenshots-ში ან `NEXT_PUBLIC_`/`VITE_` ცვლადებში. შევავსებთ პროვაიდერის secret storage-ში ან სერვერზე დაცულ env ფაილში.

არასაიდუმლო URL-ებისა და საჭირო ცვლადების შაბლონი: [infra/production.env.example](../../infra/production.env.example). ეს კონფიგურაციის ნიმუშია და თავისით არაფერს უშვებს.

## კოდის მხარეს რა მზადაა და რა უნდა დასრულდეს

- უკვე გვაქვს web/API/admin Docker target-ები, versioned Prisma migrations, health endpoint, per-user უფლებები, secure production cookies, R2 adapter, owner invitation bootstrap და Node background jobs.
- AURA-026 ამარტივებს About/hero/services/contact რედაქტორს, სექციურ შენახვას და AI თარგმანის განხილვას. შენახული ტექსტი ახალი deploy-ის გარეშე აისახება საიტზე. არ არის საჭირო მთელი დიზაინის ხელახლა აწყობა.
- Email/SMS ამჟამად ზოგადი webhook კონტრაქტებია. Resend/Twilio/სხვა provider-ის key მარტო საკმარისი არ არის: შერჩეულ პროვაიდერზე კონკრეტული adapter ან დაცული relay უნდა დასრულდეს და გაიტესტოს. URL ველი vendor endpoint-ზე პირდაპირ არ უნდა მივუთითოთ, თუ payload/authorization არ ემთხვევა.
- საჭიროა production Compose/reverse-proxy და CI release workflow: build → tests → image tag Git SHA-ით → registry → deploy healthcheck. Docker build target/URL-ები უნდა შემოწმდეს production env-ით და build-time API-ს ხელმისაწვდომობის გარეშე. სასურველია runtime image-ის შემცირება და non-root Node მომხმარებელი.
- Proxy-ს მიღმა რეალური client IP და rate limiting უნდა გაიტესტოს. ამჟამად Fastify-ს trustProxy არ აქვს; ყველა მომხმარებელი proxy IP-ის ერთ ლიმიტში არ უნდა მოხვდეს. დავუშვებთ მხოლოდ სანდო proxy hops/ქსელს, საჯარო spoofed header-ის ნდობის გარეშე.
- საჯარო healthcheck-ს დაემატება release smoke checks და jobs-ის მუშაობის მონიტორინგი; health endpoint მარტო ყველა provider-ის/შეხსენების მუშაობას არ ადასტურებს.
- FX-სთვის პირველ ეტაპზე შესაძლებელია SuperAdmin-ის მიერ გადამოწმებული USD/GEL კურსის ხელით შეყვანა შესაბამისი თარიღით. საჯარო გადაყვანისთვისაც მიმდინარე კურსი უნდა განახლდეს. თუ გვინდა ავტომატიზაცია, ისტორიული და მიმდინარე კურსის სანდო provider/adapter ცალკე დასრულდება.

## მონაცემების და ფაილების გადატანა

Production შეიქმნება ცარიელი, ცალკე Aura ბაზით და migrations-ით. `db:seed` პროდაქშენზე არ გაეშვება; ადგილობრივი ბაზის სრული dump არ გამოიყენება, რადგან შეიცავს სატესტო მომხმარებლებს, ლიდებს და ავტორიზაციის მონაცემებს.

გადასატანია მხოლოდ დამტკიცებული Tbilisi Boulevard პროექტი, buildings/floors/units, polygons, საჭირო media და დამტკიცებული site copy/team profiles. წინასწარ მომზადდება inventory-only export/import, dry-run, რაოდენობების შედარება და წყაროს/დანიშნულების მკაფიო guard-ები. არსებული ლოკალური importer ავტომატურად არ ჩაითვლება production migration-ად. Pini-ს production არ იცვლება და runtime კავშირი არ იქმნება.

რეპოში არსებული Boulevard-ის სტატიკური ფაილები web image-ს გაჰყვება. `.data/uploads`-ში შენახული ფაილები image-ში არ ხვდება — გადასატანი ატვირთული media ცალკე უნდა აიტვირთოს კერძო R2-ში და შენარჩუნდეს Media ჩანაწერების შესაბამისობა. გადასატანი ფაილები რაოდენობით/ჰეშებით მოწმდება. ლოკალური მხოლოდ-განვითარების filesystem storage პროდაქშენზე არ ჩაირთვება.

ოთხივე ენის ტექსტი, სტატუსები, დარჩენილი ხელმისაწვდომი ბინების ფასები/ფართობები/პოლიგონები და დამალული მინიმალური ფასები უნდა დადასტურდეს. 2026-10-08-ის snapshot-ში 188 ხელმისაწვდომი ბინიდან 97-ს ფასი არ აქვს, 3-ს ფართობი/ოთახები აკლია და 14-ს ბინის პოლიგონი. უფასო ფასის გამოგონების ნაცვლად დარჩება ინფორმაციის მოთხოვნა; თითოეული ფაქტობრივი/გეომეტრიის ხარვეზი უნდა გადამოწმდეს. 180 გაყიდულ ბინაზე გამოტოვებული ინფორმაცია დაბრკოლებად არ ითვლება, რადგან ისინი ისედაც არაინტერაქტიულია. ინგლისური ტექსტი Hebrew ველში დასრულებულ თარგმანად არ ჩაითვლება. ატვირთვა არ ნიშნავს ავტომატურ გამოქვეყნებას.

## გაშვების მიმდევრობა

1. **გადაწყვეტილებები:** დადასტურდეს Droplet ზომა, email/SMS provider-ები, owner email, საკონტაქტო მონაცემები და კონტენტის პასუხისმგებელი. დომენი უკვე გადაწყვეტილია.
2. **კოდი და release:** დასრულდეს ზემოთ აღწერილი provider/proxy/deployment საკითხები; შეიქმნას გამოცდილი release image-ები. ყოველი ცვლილება ცალკე ticket/commit-ით; production branch-ზე მხოლოდ შემოწმებული ცვლილებები.
3. **იზოლირებული staging:** იგივე HTTPS topology, ცალკე secrets/DB/bucket; ძიებისთვის noindex და შეზღუდული წვდომა. მცირე ბიუჯეტზე შეიძლება დროებითი გარემო და შემდგომ გამორთვა; მუდმივი staging ამ ბიუჯეტში ავტომატურად არ შედის.
4. **ინფრასტრუქტურა:** ცალკე Aura Droplet, OS განახლებები, SSH key-only, firewall მხოლოდ 80/443 და შეზღუდული SSH, persistent DB/TLS volumes, კონტეინერების restart policy, log rotation. DB პორტი საჯაროდ არ გამოჩნდება.
5. **ბაზა და owner:** DB მზადდება migrations-ით (`npm run deploy -w @aura/database`); email-ის ტესტის შემდეგ `owner:init -- --dry-run`, შემდეგ რეალური owner მოწვევა. Production-ში DEV_INTEGRATIONS=false.
6. **კონტენტი/media:** მხოლოდ დამტკიცებული მონაცემების გადატანა; ყველა სურათის/პოლიგონის, locale და SEO მისამართის შემოწმება; ჩანაწერების რაოდენობების შეჯერება.
7. **პროდაქშენის ტესტი:** login/logout/recovery/invitation; ოთხი როლი; კონტენტის edit/translate/review/save; პროექტი→block→floor→flat; inquiry-ის მიღება და გუნდის განაწილება; განმეორებითი inquiry OTP; ელფოსტა/SMS რეალურად; header reminders; FX/Won სცენარი staging-ზე. მობილური, dark mode და Hebrew RTL.
8. **Backup/restore რეპეტიცია:** მონაცემთა აღდგენა ცალკე ცარიელ ბაზაში, media-ის აღდგენა და permissions; შედეგის დაფიქსირება. სარეზერვო ფაილის არსებობა მარტო საკმარისი არ არის.
9. **DNS cutover:** საბოლოო release-ის და კონტენტის შემოწმების შემდეგ auraproperty.ge/www/admin/api მიებმება სერვერს; Full (strict), redirects, secure cookies/CORS, robots/sitemap/canonical/hreflang და indexability მოწმდება. MX/TXT ჩანაწერები შენარჩუნდება.
10. **შემდგომი კონტროლი:** პირველი დღეებში errors, SSL, CPU/RAM/disk, DB connections, backup-ის ასაკი, inquiry-ის მიღება/განაწილება და provider-ის delivery failures. Search Console-ის დომენის დადასტურება და sitemap-ის გაგზავნა ცალკე შესრულდება.

## Backup, მონიტორინგი და განახლებები

მინიმალური საწყისი პოლიტიკა: ყოველდღიური encrypted PostgreSQL dump ცალკე backup bucket-ში, 14 დღიური და 4 კვირეული ასლის შენახვა; ყოველი migration-ის წინ დამატებითი dump. Droplet-ის weekly backup დამატებითი დაცვაა და მონაცემთა ბაზის სარეზერვო ასლს არ ანაცვლებს. ბიუჯეტი მცირე off-host საცავზეა გათვლილი. ყოველდღიური backup-ით შესაძლო დანაკარგის სამიზნე მაქსიმუმ 24 საათია; თუ ეს ბიზნესისთვის ბევრია, საჭიროა საათობრივი backup ან managed DB/PITR და ბიუჯეტის ცვლილება. აღდგენის სასურველი დრო 2–4 საათია, დასადასტურებელი რეპეტიციით.

გარედან მონიტორინგი შეამოწმებს მთავარ გვერდსა და API health-ს; ცალკე კონტროლდება jobs heartbeat, provider errors, backup age და დისკი. Logs-ში არ უნდა ჩაიწეროს პაროლები, tokens ან სრული მომხმარებლის მონაცემები. იმართება log rotation, რესურსის alerts და API/AI/SMS ხარჯის alerts. 2 GB ვარიანტზე memory pressure/swap/OOM ან შენელება 4 GB-ზე გადასვლის სიგნალია; დიდი ტრაფიკის დაპირება გაზომვის გარეშე არ კეთდება.

ჩვეულებრივი განახლება: მცირე ticket/commit → ავტომატური checks → staging → backup თუ migration არის → ახალი immutable image → migrations → health/smoke checks → production. ინახება წინა image-ის tag. App rollback აბრუნებს image-ს; database migration ავტომატურად უკან არ ბრუნდება. სასურველია backward-compatible expand/contract ცვლილებები. DB restore გადაუდებელი ნაბიჯია და ბოლო backup-ის შემდეგ მიღებულ მონაცემებს ეხება, ამიტომ incident-ის დროს ცალკე გადაწყვეტილებას მოითხოვს.

შემდეგი პრაქტიკული ნაბიჯია სერვერის ზომისა და provider-ების არჩევა, რის შემდეგაც შესაძლებელი იქნება კონკრეტული deployment კონფიგურაციის დასრულება და staging-ზე გაშვება. მიმდინარე ticket არ აცხადებს საიტს უკვე გამოქვეყნებულად.
