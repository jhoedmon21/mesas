const q = `[out:json][timeout:60];
(
  nwr["name"~"Cristo Rey",i](-16.40,-71.62,-16.28,-71.50);
  nwr["name"~"Sales",i](-16.40,-71.62,-16.28,-71.50);
  nwr["name"~"Bedoya",i](-16.45,-71.70,-16.25,-71.48);
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
console.log("status", res.status);
const json = await res.json();
for (const e of json.elements ?? []) {
  const lat = e.lat ?? e.center?.lat;
  const lon = e.lon ?? e.center?.lon;
  console.log(
    `${lat},${lon}  ${e.tags?.name}  [${e.tags?.amenity ?? e.tags?.place ?? "?"}]  ${e.tags?.["addr:street"] ?? ""} ${e.tags?.["addr:district"] ?? ""}`,
  );
}
