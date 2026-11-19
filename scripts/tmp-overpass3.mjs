const q = `[out:json][timeout:90];
(
  node["amenity"~"school|kindergarten|college"](-16.35,-71.60,-16.30,-71.53);
  way["amenity"~"school|kindergarten|college"](-16.35,-71.60,-16.30,-71.53);
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
console.log("elementos", json.elements?.length);
for (const e of json.elements ?? []) {
  const lat = e.lat ?? e.center?.lat;
  const lon = e.lon ?? e.center?.lon;
  console.log(`${lat.toFixed(6)},${lon.toFixed(6)}  ${e.tags?.name}  [${e.tags?.amenity}]`);
}
