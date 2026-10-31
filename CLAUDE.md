# Volcán Laguna · sitio web (volcan-laguna-web)

Sitio de hospedaje y retiros de **Volcán Laguna**: tres casas a la orilla de la Laguna de Santa María del Oro, Nayarit, México. Dueña: Beatriz Barragán (Bea). Desarrollador: D4ny (GitHub `danilili`). Este repo reemplaza un sitio WordPress + MotoPress que vive en staging en https://stg-3lf40z.elementor.cloud (referencia de contenido, NO de diseño).

Plan completo y auditoría de diseño: documento de Claude "Volcán Laguna · Plan del sitio nuevo en código (Vercel)". Corte a producción: 27 nov 2026. Tope duro: 15 dic 2026.

## Stack (no cambiar sin hablar con D4ny)

- **Next.js 16 (App Router, Cache Components activado), TypeScript, Tailwind v4**. Se instaló 16.4.3 con `create-next-app@latest` el 31 oct 2026; el plan original decía 15. Deploy en **Vercel** (dominio `volcanlaguna.com`, por comprar).
- Contenido de páginas en **MDX** dentro de `content/` (casas, textos del Home, alimentos, términos, privacidad). Sin CMS.
- Retiros y cotizaciones en **Supabase** (tablas `retiros`, `retiro_fotos`, `cotizaciones_retiro`). Proyecto de Supabase ya existe (el de Tlali); las tablas nuevas se crean con migraciones en `supabase/migrations/`, numeradas desde `012_`.
- **Beds24 es la única fuente de precios, disponibilidad y estancias mínimas.** El sitio nunca calcula precios. Propiedad 353281; habitaciones: Casa Los Mangos 728645, Los Mangos para cuatro 728648, Casa Moringa 728649, Casa Santuario 728650, Santuario para cuatro 728651.
- Las reservas las crea **n8n** (`VL · crear-reserva`), no el sitio: el sitio valida la oferta en el servidor y llama al webhook de n8n con origen `web`.
- Mensajes al huésped por **WhatsApp Cloud API** (plantillas) desde n8n. Correo solo como copia.
- Imágenes en `public/` durante el desarrollo; antes del corte pasan a Vercel Blob. Fuente: carpeta `media/web/` de Bea (ya optimizadas a 1920 px con alt).
- Animación: `motion` (Framer Motion) con `prefers-reduced-motion` respetado. 360°: Photo Sphere Viewer.

## Reglas

1. **Secretos**: nunca en el código ni en commits. Solo `.env.local` (en `.gitignore`) y variables de entorno de Vercel. Si falta una llave, pide que D4ny la capture; no la pidas en el chat. Deja un `.env.example` con los nombres de las variables.
2. **Nada destructivo** en Beds24, Supabase, n8n ni WordPress sin que D4ny lo apruebe por escrito. Leer sí; crear reservas solo en modo prueba y avisando.
3. **Idioma**: UI y contenido en español de México; código, nombres de archivos y commits en inglés. Estructura preparada para `/en` sin contenido todavía.
4. **Commits pequeños** con mensaje claro; no reescribir historia.
5. **Celular primero** (390 px). Toda sección del Home cabe en una pantalla de celular.
6. **Texto reducido**: en el Home máximo 2 líneas por bloque; las descripciones largas van dentro de cada casa, colapsadas.
7. No instales dependencias pesadas sin justificarlo en el PR/commit.

## Contenido de referencia (staging de WordPress)

Exportar una sola vez por REST, sin autenticación, y convertir a MDX:
- Casas: `GET /wp-json/wp/v2/mphb_room_type?per_page=20` → ids 1297 Santuario, 1299 Los Mangos, 1338 Moringa, 1384 Santuario para 4, 1382 Los Mangos para 4. Ignorar 86, 100, 111, 124 (demo).
- Páginas: 11 Home, 254 Alimentos, 1407 Organiza tu retiro, 317 Términos, 1546 Aviso de privacidad, 300 Galería.
- Retiros: `GET /wp-json/wp/v2/posts?categories=104&per_page=30` (pasados) y `categories=103` (próximos; el 1374 es un EJEMPLO, no migrar).
- Medios: `GET /wp-json/wp/v2/media?per_page=100&page=N` para los `alt` y nombres; los archivos se toman de `media/web/` de la carpeta de Bea, no se descargan del staging.
- Datos fijos: tel/WhatsApp 523318485909 · correo volcanlagunamx@gmail.com · dirección Paseo de la Rivera, La Laguna, Santa María del Oro, Nay., C.P. 63865 · pin 21.3780406, -104.566497 · Google 4.9 ★ (27 reseñas) · entrada 13:00, salida 15:00 · sin internet en ninguna casa · sin mascotas · no se fuma dentro · estancia mínima 2 noches (3 en Semana Santa 2027 y del 18 dic al 3 ene) · capacidad: Santuario 10 (5 recámaras), Los Mangos 12 (3), Moringa 6 (2), versiones para 4 (2 recámaras: king + matrimonial).
- Precios de referencia (vie–dom / lun–jue, por noche, MXN): Santuario 15,000 / 11,250 · Santuario para 4 6,000 / 4,500 · Los Mangos 7,500 / 5,625 · Los Mangos para 4 3,400 / 2,550 · Moringa 3,800 / 2,850. Solo para mostrar "desde"; el precio real siempre viene de Beds24.

## Dirección de diseño (resumen de la auditoría)

Idea: "la laguna te recibe". Imagen y video al 70 %, texto al 30 %, una sola acción por pantalla.
- Paleta: azul laguna profundo (hero y footer), arena/dorado del logo (acentos y botones), blanco roto (fondo), verde selva (íconos). Definir en `app/globals.css` como tokens.
- Tipografía: Fraunces (títulos) + Inter (cuerpo), vía `next/font`. Cuerpo 16–18 px. Sin "estrellas de hotel".
- Íconos: set propio de línea en SVG (`components/icons/`), ~20: laguna, muelle, jacuzzi, kayak, lancha, temazcal, masaje, yoga, cocina de plantas, recámara, baño, estacionamiento, jardín, chimenea, asador, limpieza, WhatsApp, calendario, personas, ubicación.
- Movimiento: reveals al scroll (opacidad + 12 px), parálax sutil solo en fotos de sección, hover en tarjetas (foto +3 %), transiciones 200 ms. Nada gira ni rebota.
- Hero del Home: video mudo en bucle cuando exista; mientras, fotos aéreas con Ken Burns lento.
- Home: 1 hero (frase + 4.9 ★ + Reservar / Organiza tu retiro + barra de fechas) · 2 "Somos…" selector por tamaño de grupo · 3 las casas (precio por noche en vivo) · 4 la laguna (4 experiencias) · 5 retiros · 6 alimentos (6 fotos, una frase) · 7 reseñas de Google · 8 mapa + cómo llegar + WhatsApp.
- Menú: Casas · Retiros · Alimentos · La laguna + botón "Reservar" siempre visible + WhatsApp flotante.

## Estructura del repo (objetivo)

```
app/            rutas (page.tsx, casas/[slug], retiros, organiza-tu-retiro, alimentos, la-laguna, contacto, reservar, legal/*)
app/api/        availability (consulta Beds24), quote (oferta), booking (llama a n8n), revalidate
components/     ui/, sections/, icons/
content/        casas/*.mdx, home.mdx, alimentos.mdx, legal/*.mdx
lib/            beds24.ts, supabase.ts, n8n.ts, content.ts, format.ts
public/images/  fotos optimizadas por carpeta (santuario, los-mangos, moringa, general, retiros/, alimentos)
supabase/migrations/
scripts/        export-wordpress.ts (una sola vez)
```

## Entregables por semana

- **S1 (2–6 nov)**: sitio navegable completo sin reservas; página de muestra del Home con diseño cerrado el miércoles 4.
- **S2 (9–13 nov)**: buscador y calendario con precios de Beds24, checkout → n8n, página de confirmación.
- **S3 (16–20 nov)**: retiros desde Supabase, formulario de cotización, SEO, Analytics.
- **S4 (23–27 nov)**: pruebas con Bea y corte.
