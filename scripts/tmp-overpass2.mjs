const consultas = [
  { nombre: "bedoya", lat: -16.3265, lon: -71.5638, radio: 1500 },
  { nombre: "talents", lat: -16.3187, lon: -71.5503, radio: 900 },
  { nombre: "cristo", lat: -16.3255, lon: -71.5483, radio: 900 },
];

for (const c of consultas) {
  const q = `[out:json][timeout:60];
(
  node["amenity"~"school|kindergarten|college"](${c.lat - 0.02},${c.lon - 0.02},${c.lat + 0.02},${c.lon + 0.02});
  way["amenity"~"school|kindergarten|college"](${c.lat - 0.02},${c.lon - 0.02},${c.lat + 0.02},${c.lon + 0.02});
);
out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Cerreno3D/1.0 (verificacion de locales)",
    },
    body: "data=" + encodeURIComponent(q),
  });
  const json = await res.json();
  console.log(`\n=== ${c.nombre} (${json.elements?.length ?? 0}) ===`);
  for (const e of json.elements ?? []) {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const d = Math.hypot((lat - c.lat) * 110574, (lon - c.lon) * 106000);
    if (d > c.radio / 1000) continue;
    console.log(
      `${Math.round(d * 1000)}m  ${lat.toFixed(6)},${lon.toFixed(6)}  ${e.tags?.name}`,
    );
  }
  await new Promise((r) => setTimeout(r, 1500));
}
