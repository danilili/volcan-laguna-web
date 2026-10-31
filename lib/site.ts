/**
 * Fixed site data. Everything here comes from the project brief (CLAUDE.md).
 * Prices here are *reference* prices ("desde"); the real price always comes from Beds24.
 */

export const site = {
  name: "Volcán Laguna",
  tagline: "Tres casas a la orilla de la Laguna de Santa María del Oro",
  domain: "volcanlaguna.com",
  url: "https://volcanlaguna.com",
  locale: "es-MX",
  phone: "523318485909",
  phoneDisplay: "+52 33 1848 5909",
  email: "volcanlagunamx@gmail.com",
  address: {
    street: "Paseo de la Rivera",
    neighborhood: "La Laguna",
    city: "Santa María del Oro",
    state: "Nayarit",
    stateShort: "Nay.",
    zip: "63865",
    country: "México",
  },
  geo: { lat: 21.3780406, lng: -104.566497 },
  google: { rating: 4.9, reviews: 27 },
  checkIn: "13:00",
  checkOut: "15:00",
  minNights: 2,
  minNightsHighSeason: 3,
  policies: [
    "Sin internet en ninguna casa",
    "Sin mascotas",
    "No se fuma dentro",
    "Estancia mínima 2 noches (3 en Semana Santa y del 18 dic al 3 ene)",
  ],
  beds24: {
    propertyId: 353281,
    rooms: {
      "los-mangos": 728645,
      "los-mangos-para-4": 728648,
      moringa: 728649,
      santuario: 728650,
      "santuario-para-4": 728651,
    },
  },
  social: {
    instagram: "", // TODO: confirm handle with Bea
    facebook: "", // TODO: confirm page with Bea
  },
} as const;

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${site.phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`;
export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`;

export const nav = [
  { href: "/casas", label: "Casas" },
  { href: "/retiros", label: "Retiros" },
  { href: "/alimentos", label: "Alimentos" },
  { href: "/la-laguna", label: "La laguna" },
] as const;
