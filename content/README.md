# content/

Contenido editable del sitio (español de México). Se lee con `lib/content.ts`.

- `casas/*.mdx` — una casa por archivo; frontmatter con datos y galería, cuerpo con la descripción larga.
- `home.mdx` — frase del hero y textos cortos de las 8 secciones del Home.
- `alimentos.mdx`, `organiza-tu-retiro.mdx`, `legal/*.mdx` — páginas de texto.
- `retiros.json` — retiros exportados del staging (se migran a Supabase en la semana 3).
- `resenas.json` — reseñas de Google curadas a mano: `[{ "autor", "texto", "fecha", "estrellas" }]`. TODO: llenar con Bea.
- `imagenes.json` — manifiesto de `public/images/**` con alt, width y height.

Todo menos `resenas.json` y este README lo genera `pnpm export:wp` (`scripts/export-wordpress.ts`).
Se corrió una sola vez; si se vuelve a correr, borra y regenera lo suyo.
