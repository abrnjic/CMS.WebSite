import { getDb } from "../server/queries/connection";
// Seed — pocetni sadrzaj (isti podaci kao u prototipu)
const season = (base: number) => [
  {
    from: "2026-06-01",
    to: "2026-06-30",
    pricePerNight: Math.round(base * 1.25),
    label: "Srednja sezona",
  },
  {
    from: "2026-07-01",
    to: "2026-08-31",
    pricePerNight: Math.round(base * 1.6),
    label: "Visoka sezona",
  },
  {
    from: "2026-09-01",
    to: "2026-09-30",
    pricePerNight: Math.round(base * 1.25),
    label: "Srednja sezona",
  },
];

const PROPERTY_DATA = [
  {
    slug: "villa-mare-hvar",
    name: "Villa Mare",
    type: "villa" as const,
    tagline: "Infinity bazen nad paklenim otocima",
    description:
      "Villa Mare smještena je na južnoj padini Hvara, s neometanim pogledom na Paklene otoke. Moderna arhitektura od kamena i stakla otvara se prema moru, a infinity bazen stapа se s horizontom. Idealna za obitelji ili grupe koje traže mir, dizajn i izravan prilaz moru stazom kroz maslinik.",
    city: "Hvar",
    region: "Splitsko-dalmatinska",
    address: "Put Sv. Nikole 12, Hvar",
    lat: 43.17,
    lng: 16.44,
    rating: "4.9",
    reviewCount: 87,
    amenities: [
      "wifi",
      "parking",
      "pool",
      "ac",
      "kitchen",
      "washer",
      "tv",
      "terrace",
      "seaview",
      "bbq",
    ],
    images: ["apt3", "int1", "int2", "int3"],
    distanceToSea: 80,
    featured: true,
    units: [
      {
        name: "Villa Mare — cijela vila",
        maxGuests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 3,
        sizeM2: 210,
        basePrice: "320",
        minNights: 4,
        cleaningFee: "90",
        touristTax: "1.6",
        priceRules: season(320),
        images: ["apt3", "int1", "int2", "int3"],
      },
    ],
  },
  {
    slug: "apartman-riva-dubrovnik",
    name: "Apartman Riva",
    type: "apartment" as const,
    tagline: "Jutarnja kava s pogledom na stari grad",
    description:
      "Svijetao, moderno uređen apartman s prozorima od poda do stropa i pogledom koji ne dosadi. Nalazi se svega nekoliko minuta hoda od gradske plaže, a uokolo su konobe, tržnica i šetnica uz more.",
    city: "Dubrovnik",
    region: "Dubrovačko-neretvanska",
    address: "Obala Stjepana Radića 4, Dubrovnik",
    lat: 42.65,
    lng: 18.09,
    rating: "4.8",
    reviewCount: 132,
    amenities: ["wifi", "ac", "kitchen", "tv", "terrace", "seaview", "washer"],
    images: ["apt1", "int1", "int2", "int4"],
    distanceToSea: 30,
    featured: true,
    units: [
      {
        name: "Apartman Riva 1 — dvosoban",
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 1,
        sizeM2: 68,
        basePrice: "110",
        minNights: 3,
        cleaningFee: "40",
        touristTax: "1.6",
        priceRules: season(110),
        images: ["apt1", "int1", "int2"],
      },
      {
        name: "Apartman Riva 2 — studio",
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        sizeM2: 34,
        basePrice: "75",
        minNights: 2,
        cleaningFee: "25",
        touristTax: "1.6",
        priceRules: season(75),
        images: ["apt1", "int2", "int4"],
      },
    ],
  },
  {
    slug: "kuca-oliva-istria",
    name: "Kuća Oliva",
    type: "house" as const,
    tagline: "Istarski kamen, lavanda i vlastiti bazen",
    description:
      "Renovirana istarska kamena kuća u srcu bršćanskog zaleđa. Okružena maslinicima i lavandom, s privatnim bazenjem i ljetnom kuhinjom. Savršena baza za istraživanje istarskih gradića, vinarija i konoba.",
    city: "Motovun",
    region: "Istarska",
    address: "Kaldir 7, Motovun",
    lat: 45.33,
    lng: 13.83,
    rating: "4.9",
    reviewCount: 64,
    amenities: [
      "wifi",
      "parking",
      "pool",
      "ac",
      "kitchen",
      "washer",
      "tv",
      "terrace",
      "garden",
      "bbq",
      "pets",
    ],
    images: ["apt2", "int4", "int1", "int2"],
    distanceToSea: 14000,
    featured: true,
    units: [
      {
        name: "Kuća Oliva — cijela kuća",
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        sizeM2: 140,
        basePrice: "180",
        minNights: 4,
        cleaningFee: "60",
        touristTax: "1.5",
        priceRules: season(180),
        images: ["apt2", "int4", "int1", "int2"],
      },
    ],
  },
  {
    slug: "kameni-san-split",
    name: "Kameni San",
    type: "apartment" as const,
    tagline: "Svjetionik starog grada, kameni svodovi",
    description:
      "Apartman u kamenoj kući iz 17. stoljeća, unutar Dioklecijanove palače. Izloženi kameni zidovi i svodovi, pažljivo spojeni s modernim udobnostima. Korak ste od Peristila, Rive i tržnice.",
    city: "Split",
    region: "Splitsko-dalmatinska",
    address: "Kraj Svete Marije 3, Split",
    lat: 43.51,
    lng: 16.44,
    rating: "4.7",
    reviewCount: 98,
    amenities: ["wifi", "ac", "kitchen", "tv", "washer"],
    images: ["apt4", "int1", "int4", "int3"],
    distanceToSea: 250,
    featured: false,
    units: [
      {
        name: "Kameni San — apartman",
        maxGuests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        sizeM2: 52,
        basePrice: "95",
        minNights: 2,
        cleaningFee: "30",
        touristTax: "1.6",
        priceRules: season(95),
        images: ["apt4", "int1", "int4", "int3"],
      },
    ],
  },
  {
    slug: "kuca-juraj-makarska",
    name: "Kuća Juraj",
    type: "house" as const,
    tagline: "Vrt, roštilj i Biokovo na dlanu",
    description:
      "Prostrana obiteljska kuća s velikim vrtom, terasom za objedovanje i roštiljem. Smještena u mirnoj ulici, a do plaže je desetak minuta laganog hoda. Biokovo se uzdiže iza kuće — izvrsno za izlete i planinarenje.",
    city: "Makarska",
    region: "Splitsko-dalmatinska",
    address: "Veliko Brdo 21, Makarska",
    lat: 43.3,
    lng: 17.02,
    rating: "4.6",
    reviewCount: 73,
    amenities: [
      "wifi",
      "parking",
      "ac",
      "kitchen",
      "washer",
      "tv",
      "terrace",
      "garden",
      "bbq",
      "pets",
    ],
    images: ["apt5", "int2", "int4", "int1"],
    distanceToSea: 800,
    featured: false,
    units: [
      {
        name: "Kuća Juraj — cijela kuća",
        maxGuests: 7,
        bedrooms: 3,
        beds: 5,
        bathrooms: 2,
        sizeM2: 130,
        basePrice: "140",
        minNights: 3,
        cleaningFee: "50",
        touristTax: "1.5",
        priceRules: season(140),
        images: ["apt5", "int2", "int4", "int1"],
      },
    ],
  },
  {
    slug: "penthouse-horizont-rovinj",
    name: "Penthouse Horizont",
    type: "apartment" as const,
    tagline: "Terasa od koje se zalasci pamte",
    description:
      "Penthouse na vrhu zgrade s prostranom terasom, vanjskom blagovaonicom i pogledom na rovinjsko otočje. Staklena ograda, dizajnerski namještaj i večernje svjetlo čine ga mjestom na koje se uvijek vraćate.",
    city: "Rovinj",
    region: "Istarska",
    address: "Obala Pina Budicina 16, Rovinj",
    lat: 45.08,
    lng: 13.64,
    rating: "5.0",
    reviewCount: 41,
    amenities: [
      "wifi",
      "parking",
      "ac",
      "kitchen",
      "washer",
      "tv",
      "terrace",
      "seaview",
    ],
    images: ["apt6", "int3", "int1", "int2"],
    distanceToSea: 60,
    featured: true,
    units: [
      {
        name: "Penthouse Horizont — cijeli kat",
        maxGuests: 5,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        sizeM2: 96,
        basePrice: "210",
        minNights: 3,
        cleaningFee: "55",
        touristTax: "1.6",
        priceRules: season(210),
        images: ["apt6", "int3", "int1", "int2"],
      },
    ],
  },
  {
    slug: "koliba-maslina-brac",
    name: "Koliba Maslina",
    type: "house" as const,
    tagline: "Kamena koliba usred maslinika",
    description:
      "Autentična dalmatinska kamena koliba obnovljena s ljubavlju, usred maslinika i vinograda otoka Brača. Drvene roletne, kamena terasa pod pergolom i tišina kakve u gradu nema. Za one koji traže usporiti.",
    city: "Supetar, Brač",
    region: "Splitsko-dalmatinska",
    address: "Mirca bb, Brač",
    lat: 43.38,
    lng: 16.51,
    rating: "4.8",
    reviewCount: 56,
    amenities: [
      "wifi",
      "parking",
      "kitchen",
      "terrace",
      "garden",
      "bbq",
      "pets",
    ],
    images: ["apt7", "int4", "int2", "int1"],
    distanceToSea: 400,
    featured: false,
    units: [
      {
        name: "Koliba Maslina — cijela kuća",
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 1,
        sizeM2: 78,
        basePrice: "120",
        minNights: 3,
        cleaningFee: "35",
        touristTax: "1.5",
        priceRules: season(120),
        images: ["apt7", "int4", "int2", "int1"],
      },
    ],
  },
  {
    slug: "studio-sol-zadar",
    name: "Studio Sol",
    type: "apartment" as const,
    tagline: "Minimalizam s okom na Jadran",
    description:
      "Rafinirano minimalistički studio s betonom, hrastom i velikim prozorom prema moru. Nalazi se kraj Pozdrava suncu i Morskih orgulja — zalasci ovdje dolaze sa vlastitom glazbenom podlogom.",
    city: "Zadar",
    region: "Zadarska",
    address: "Istarska obala 9, Zadar",
    lat: 44.12,
    lng: 15.23,
    rating: "4.7",
    reviewCount: 89,
    amenities: ["wifi", "ac", "kitchen", "tv", "seaview", "washer"],
    images: ["apt8", "int2", "int3", "int1"],
    distanceToSea: 20,
    featured: false,
    units: [
      {
        name: "Studio Sol — studio",
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        sizeM2: 38,
        basePrice: "85",
        minNights: 2,
        cleaningFee: "25",
        touristTax: "1.6",
        priceRules: season(85),
        images: ["apt8", "int2", "int3", "int1"],
      },
    ],
  },
];

// CMS pocetne stranice
const DEFAULT_PAGES = [
  {
    slug: "home",
    title: "Naslovnica",
    status: "published" as const,
    blocks: [
      {
        id: "b1",
        type: "hero",
        props: {
          variant: "klasicni",
          image: "hero",
          label: "Iznajmljivanje apartmana i kuca — Jadran",
          title: "Tvoj dom\nuz more.",
          subtitle:
            "Pažljivo odabrani apartmani, kuce i vile duz Jadrana — s trenutnom potvrdom, pravim kalendarom dostupnosti i sigurnim placanjem.",
        },
      },
      { id: "b2", type: "search-bar", props: { variant: "traka" } },
      {
        id: "b3",
        type: "property-grid",
        props: {
          variant: "mreza",
          kicker: "Izbor urednistva",
          heading: "Istaknuti objekti",
          featuredOnly: true,
          count: 4,
        },
      },
      {
        id: "b6",
        type: "gallery",
        props: {
          variant: "masonry",
          kicker: "Dojmovi",
          heading: "Galerija",
          images: [
            "apt1",
            "int1",
            "apt3",
            "int2",
            "apt5",
            "apt7",
            "int3",
            "apt8",
          ],
        },
      },
      {
        id: "b4",
        type: "feature-strip",
        props: {
          variant: "brojevi",
          t1: "Kalendar dostupnosti",
          d1: "Svaka jedinica ima vlastiti kalendar. Zauzeti datumi sinkroniziraju se i s Airbnb i Booking kanalima, bez dvostrukih rezervacija.",
          t2: "Sigurno placanje",
          d2: "Karticno placanje s 15-minutnom rezervacijom termina. Novac se povlači tek kad je rezervacija potvrdjena.",
          t3: "Sve je uredjivo",
          d3: "Stranice, teme, boje, sadrzaj — vlasnik sve mijenja kroz admin panel, bez programera. Kao WordPress, ali za iznajmljivanje.",
        },
      },
      {
        id: "b7",
        type: "reviews",
        props: {
          variant: "kartice",
          kicker: "Sto kazu gosti",
          heading: "Recenzije",
          source: "4.9 na Googleu",
          r1name: "Ivana K.",
          r1text:
            "Savrsena lokacija, cisto i uredno. Rezervacija je prosla bez ijednog problema.",
          r1rating: 5,
          r1when: "prije 2 tjedna",
          r2name: "Marko P.",
          r2text:
            "Kalendar dostupnosti je tocno prikazao slobodne termine — nikakvih iznenadjenja.",
          r2rating: 5,
          r2when: "prije mjesec dana",
          r3name: "Sara M.",
          r3text:
            "Vrlo profesionalna komunikacija s domacinom. Preporucujem svima!",
          r3rating: 4,
          r3when: "prije 2 mjeseca",
        },
      },
      {
        id: "b5",
        type: "destinations",
        props: {
          variant: "mreza",
          kicker: "Gdje dalje",
          heading: "Destinacije",
        },
      },
    ],
  },
  {
    slug: "o-nama",
    title: "O nama",
    status: "published" as const,
    blocks: [
      {
        id: "b10",
        type: "about",
        props: {
          variant: "split",
          kicker: "Nas tim",
          heading: "O nama",
          body: "Adriatic Stays nastao je iz jednostavne ideje: iznajmljivanje nekretnina uz Jadran zaslužuje alat koji je lijep kao i sami objekti.\nGradimo modularni CMS koji vlasnicima daje potpunu kontrolu — od izgleda stranica do kalendara i placanja — bez ijedne linije koda.",
          image: "apt7",
          quote: "Radimo ono sto volimo — i to se vidi.",
          quoteAuthor: "Osnivac",
          s1num: "120+",
          s1label: "objekata",
          s2num: "4.9",
          s2label: "prosjecna ocjena",
          s3num: "10k",
          s3label: "gostiju godisnje",
        },
      },
      {
        id: "b11",
        type: "image-banner",
        props: {
          variant: "standard",
          image: "apt7",
          caption:
            "Koliba Maslina, Brac — jedan od prvih objekata na platformi",
        },
      },
      {
        id: "b12",
        type: "cta-banner",
        props: {
          variant: "centrirano",
          title: "Zelite li ponuditi svoj objekt?",
          text: "Pridruzite se platformi i objavite svoj smjestaj za nekoliko minuta.",
          buttonLabel: "Kontaktirajte nas",
          buttonLink: "mailto:info@adriatic-stays.hr",
        },
      },
    ],
  },
];

export async function runSeed(): Promise<boolean> {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const lock = db.collection("_locks").doc("demo-seed");
    const marker = await tx.get(lock);
    const ps = await tx.get(db.collection("properties").limit(1));
    const us = await tx.get(db.collection("units").limit(1));
    const pages = await tx.get(db.collection("pages").limit(1));
    const counterRefs = ["properties", "units", "pages"].map((n) =>
      db.collection("_counters").doc(n),
    );
    const counters = await Promise.all(counterRefs.map((r) => tx.get(r)));
    if (marker.exists || !ps.empty || !us.empty || !pages.empty) return false;
    let pi = Number(counters[0].data()?.value || 0),
      ui = Number(counters[1].data()?.value || 0),
      pg = Number(counters[2].data()?.value || 0);
    for (const property of PROPERTY_DATA) {
      const { units, ...data } = property;
      const id = ++pi;
      tx.create(db.collection("properties").doc(String(id)), {
        ...data,
        id,
        createdAt: new Date(),
      });
      tx.create(db.collection("_property_slugs").doc(data.slug), { id });
      for (const unit of units) {
        const unitId = ++ui;
        tx.create(db.collection("units").doc(String(unitId)), {
          ...unit,
          id: unitId,
          propertyId: id,
          currency: "EUR",
          calendarVersion: 0,
        });
      }
    }
    for (const page of DEFAULT_PAGES) {
      const id = ++pg;
      tx.create(db.collection("pages").doc(String(id)), {
        id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        draft: page.blocks,
        published: page.blocks,
        seoTitle: null,
        seoDescription: null,
        updatedAt: new Date(),
      });
      tx.create(db.collection("_page_slugs").doc(page.slug), { id });
    }
    [pi, ui, pg].forEach((value, i) => tx.set(counterRefs[i], { value }));
    tx.create(lock, { createdAt: new Date() });
    return true;
  });
}
