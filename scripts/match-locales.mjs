import { readFile, writeFile } from "node:fs/promises";

const locales = JSON.parse(await readFile("data/onpe-locales.json", "utf8"));

const consulta = `[out:json][timeout:60];
(
  node["amenity"="school"](-16.47,-71.68,-16.28,-71.44);
  way["amenity"="school"](-16.47,-71.68,-16.28,-71.44);
  relation["amenity"="school"](-16.47,-71.68,-16.28,-71.44);
);
out center tags;`;

const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": "Cerreno3D/1.0 (mapeo de locales)",
  },
  body: "data=" + encodeURIComponent(consulta),
});
const osm = await res.json();
const escuelas = (osm.elements ?? [])
  .map((e) => ({
    nombre: e.tags?.name ?? e.tags?.["name:es"] ?? "",
    lat: e.lat ?? e.center?.lat,
    lon: e.lon ?? e.center?.lon,
  }))
  .filter((e) => e.nombre && e.lat && e.lon);

const stop = new Set([
  "ie",
  "iep",
  "iepc",
  "institucion",
  "educativa",
  "educativo",
  "colegio",
  "school",
  "sede",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "n",
  "nro",
  "nuestra",
  "senor",
  "senora",
]);

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && !stop.has(t));
}

function puntaje(a, b) {
  const ta = new Set(normalizar(a));
  const tb = new Set(normalizar(b));
  if (!ta.size || !tb.size) return 0;
  let comunes = 0;
  for (const t of ta) if (tb.has(t)) comunes += 1;
  const jaccard = comunes / (ta.size + tb.size - comunes);
  const numerosA = [...ta].filter((t) => /^\d{3,6}$/.test(t));
  const numerosB = [...tb].filter((t) => /^\d{3,6}$/.test(t));
  const numero = numerosA.some((n) => numerosB.includes(n)) ? 0.35 : 0;
  const contiene = normalizar(b).join(" ").includes(normalizar(a).join(" ")) ? 0.2 : 0;
  return jaccard + numero + contiene;
}

/* Correcciones manuales verificadas (2026-11-16)
   ----------------------------------------------------------------------------
   El puntaje difuso por nombre empareja colegios homónimos de otros distritos
   (Alexander Fleming en Arequipa, Howard My Talents en Cayma, San Francisco de
   Sales de Yura). Estas coordenadas se verificaron una por una contra el POI de
   Google Maps / OSM y la dirección del colegio, y caen dentro del límite de
   Cerro Colorado. Se aplican al final para que una nueva corrida no las pise. */
const VERIFICADOS = new Map([
  [
    17896,
    {
      lat: -16.3248092,
      lon: -71.5935041,
      fuente: "Google Maps · Urb. Ciudad Municipal Zona 1",
      nota: "el match automático era 'Alexander Fleming' (distrito de Arequipa)",
    },
  ],
  [
    32817,
    {
      lat: -16.3158124,
      lon: -71.5508398,
      fuente: "OSM · TALENT'S SCHOOL, Asoc. José María Arguedas",
      nota: "el match automático era 'Howard My Talents' (Cayma)",
    },
  ],
  [
    31860,
    {
      lat: -16.3193579,
      lon: -71.5670094,
      fuente: "I.E.P. San Francisco de Sales · Asoc. Hernán Bedoya Forga II Etapa Mz D",
      nota: "el match automático era el colegio de la Autopista La Joya (Yura)",
    },
  ],
  [
    51026,
    {
      lat: -16.325508,
      lon: -71.5485585,
      fuente: "Google Maps · I.E. Cristo Rey – CIRCA, Jirón 1",
      nota: "dirección oficial en Cerro Colorado; el anillo OSM lo deja ~100 m afuera",
      dentroDistrito: true,
    },
  ],
]);

const salida = locales.map((local) => {
  let mejor = null;
  for (const escuela of escuelas) {
    const score = puntaje(local.nombre, escuela.nombre);
    if (!mejor || score > mejor.score) mejor = { ...escuela, score };
  }
  return {
    ...local,
    lat: mejor && mejor.score >= 0.3 ? +mejor.lat.toFixed(6) : null,
    lon: mejor && mejor.score >= 0.3 ? +mejor.lon.toFixed(6) : null,
    osm: mejor && mejor.score >= 0.3 ? mejor.nombre : null,
    score: mejor ? +mejor.score.toFixed(2) : 0,
  };
});

for (const local of salida) {
  const fijo = VERIFICADOS.get(local.codigo);
  if (!fijo) continue;
  local.lat = fijo.lat;
  local.lon = fijo.lon;
  local.osm = fijo.fuente;
  local.score = 1;
  local.verificado = true;
  local.nota = fijo.nota;
  if (fijo.dentroDistrito) local.dentroDistrito = true;
}

await writeFile("data/onpe-locales-geo.json", JSON.stringify(salida, null, 2));
console.log(
  salida
    .map((l) => `${l.score.toFixed(2)} | ${l.lat},${l.lon} | ${l.nombre} => ${l.osm ?? "SIN MATCH"}`)
    .join("\n"),
);
console.log(
  `\n${salida.filter((l) => l.lat).length}/${salida.length} locales con coordenadas · ${escuelas.length} escuelas OSM`,
);
