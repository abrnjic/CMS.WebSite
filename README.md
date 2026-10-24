# CMS.WebSite — Adriatic Stays

CMS za turistički smještaj, direktne rezervacije i uređivanje stranica.

## Tehnologije

React 19, TypeScript, Vite, Tailwind i shadcn/Radix. Hono + tRPC API radi kao jedna Node.js funkcija na Vercelu. Podaci se spremaju u Cloud Firestore, prijava koristi Firebase Authentication (Google), a slike Firebase Storage. MySQL i Kimi servisi više nisu potrebni.

## Firebase: obavezno prije aktiviranja

Projekt: **cmswebsites**. Vlasnički račun: **abrnjic@gmail.com** (Vercel `OWNER_EMAIL`). Samo potvrđena e-mail adresa iz Firebase ID tokena može dobiti tu početnu ulogu; ostali administratori ulaze preko pozivnica vezanih uz e-mail.

1. U Firebase konzoli stvorite **Cloud Firestore**, Standard edition, bazu `(default)` u Native načinu. Odaberite lokaciju prije stvaranja baze.
2. U **Authentication → Sign-in method** omogućite **Google**. U **Settings → Authorized domains** dodajte produkcijsku Vercel domenu i vlastitu domenu ako je koristite. Za lokalni rad dodajte `localhost`.
3. Aktivirajte **Storage** za bucket `cmswebsites.firebasestorage.app`. Firebase može tražiti Blaze plan za Storage; troškove i aktivaciju kontrolira vlasnik Firebase projekta.
4. U **Project settings → Service accounts → Firebase Admin SDK** generirajte servisni račun. Cijeli JSON spremite izravno u **Vercel → cms → Settings → Environment Variables** kao osjetljivu varijablu **`FIREBASE_SERVICE_ACCOUNT_JSON`**, za Production (i Preview samo ako ga želite povezati s istom bazom). Nemojte ga slati u chat ili spremati u GitHub.
5. Objavite priložena zatvorena sigurnosna pravila iz `firestore.rules` i `storage.rules`. Sav pristup ide kroz API; preglednik nema izravan pristup bazi. Pravila možete kopirati u Firebase konzolu ili koristiti `firebase deploy --only firestore:rules,storage --project cmswebsites` sa svojim Firebase CLI računom. Admin SDK koristi IAM ovlasti servisnog računa i zaobilazi ova pravila.
6. Napravite novi Vercel deployment nakon promjene varijabli, otvorite `/login`, prijavite se s **abrnjic@gmail.com**, pa na `/postavljanje` unesite naziv i po želji učitajte demo objekte i stranice.

Javna web Firebase konfiguracija već je uključena. Ona **nije** administratorski ključ i ne daje serveru pristup Firestoreu. Dok serverski pristup nije konfiguriran, posjetitelji vide poruku „Stranica se priprema”. Vlasnik je odobrio javni pristup Vercel stranici.

## Lokalni rad

Potrebni su Node.js 22+ i npm.

```sh
npm ci
cp .env.example .env
# Popunite FIREBASE_SERVICE_ACCOUNT_JSON u lokalnom .env, nikada u Git.
npm run dev
```

Za lokalni Google login dodajte `localhost` u Firebase Authorized domains. Produkcijski frontend i API imaju isti origin; preglednik šalje Firebase ID token, a server provjerava potpis, opoziv, potvrđenu e-mail adresu i administratorsku ulogu. Uloge se ne prihvaćaju iz klijentskog zahtjeva.

```sh
npm run check
npm test
npm run build
npm run build:server
npm start
```

## Vercel / GitHub

Repozitorij: https://github.com/abrnjic/CMS.WebSite

Root Directory: korijen repozitorija; Framework: Vite; Install: `npm ci`; Build: `npm run build`; Output: `dist/public`; Node.js: 22.x.

`api/index.ts` je jedina Vercel funkcija. `server/` sadrži tRPC rute i Firestore upite. `vercel.json` usmjerava API, sitemap i robots zahtjeve te podržava izravan pristup SPA rutama. Produkcijska Git grana je `main`.

| Varijabla                       | Namjena                                               |
| ------------------------------- | ----------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Privatni JSON servisnog računa, samo server, obavezno |
| `FIREBASE_PROJECT_ID`           | `cmswebsites`                                         |
| `FIREBASE_STORAGE_BUCKET`       | `cmswebsites.firebasestorage.app`                     |
| `OWNER_EMAIL`                   | `abrnjic@gmail.com`, početni administrator            |
| `VITE_FIREBASE_API_KEY`         | Neobavezna zamjena javnog web API ključa              |

## Funkcije i ograničenja

- Objekti i jedinice, sezonske cijene, raspoloživost i rezervacije.
- Firestore transakcije serijaliziraju promjene kalendara iste jedinice; cijena i kapacitet provjeravaju se na serveru.
- Vizualni CMS s blokovima, skicama, objavom i poviješću verzija; teme, SEO i mediji.
- Uvoz HTTPS iCal kalendara pokreće administrator ručno; izvoz je `/api/ical/ID.ics`. Nema automatskog periodičnog osvježavanja.
- Fotografije do 3 MB po uploadu, prikazuju se preko kratkotrajnih potpisanih URL-ova.
- **Online naplata i slanje e-mail obavijesti nisu implementirani.** Gost potvrđuje rezervaciju bez kartice i dogovara plaćanje s domaćinom.
- Demo podaci nisu postojeća poslovna evidencija. Nema automatskog prijenosa iz stare MySQL baze.
- Prije aktivacije provjerite Firestore/Storage pravila i IAM ovlasti u vlastitom Firebase projektu. Rezervacije i podaci gostiju nisu javni Firestore dokumenti.

## Provjera pripreme

TypeScript provjera, frontend build, samostalni Node build i 16 testova cijena/autorizacije prolaze. ESLint još prijavljuje postojeće probleme u izvezenim UI komponentama (Fast Refresh izvoz, setState u efektima i slučajni prikaz skeletona); oni ne blokiraju Vite build. Stvarni Firestore upis, Storage upload i Google prijava moraju se provjeriti nakon dodavanja serverskih vjerodajnica i aktiviranja Firebase servisa.

Firebase Admin SDK je fiksiran na 13.10.0 zbog kompatibilnosti Vercelovog učitavanja CommonJS/ESM modula. Regresijski test provjerava učitavanje Firebase Autha i kad je nativni require(esm) isključen.

## Stanje aktivacije (24. 10. 2026.)

Firestore `(default)` je aktiviran u `europe-west3` (Frankfurt) s privatnim pravilima. Vercel funkcije koriste `fra1`, a serverski servisni račun spremljen je kao Sensitive produkcijska varijabla. Google prijava je omogućena, uz domene `cms-rose-rho.vercel.app` i `cms-proservers-projects.vercel.app`. Vlasnik je odabrao nastavak bez uploada novih fotografija na Spark planu. Za kasniju aktivaciju uploada potrebno je uključiti Blaze/Storage, postaviti bucket i njegova pravila, pa postaviti `FIREBASE_STORAGE_ENABLED=1` i napraviti Redeploy.

Aktivna tema iz admina sprema se u Firestore (`site_settings/activeTheme`) i određuje zadani izgled za posjetitelje. Izbor u javnom zaglavlju ostaje osobna postavka posjetitelja.
