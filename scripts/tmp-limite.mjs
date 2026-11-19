const q = `[out:json][timeout:60];
relation(around:260,-16.32551,-71.54856)["boundary"="administrative"]["admin_level"="8"];
out tags center;
way(around:260,-16.32551,-71.54856)["boundary"="administrative"];
out geom tags;`;

const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": "Cerreno3D/1.0 (verificacion de limites)",
  },
  body: "data=" + encodeURIComponent(q),
});
const json = await res.json();
for (const e of json.elements ?? []) {
  if (e.type === "relation") {
    console.log("REL", e.tags?.name, e.tags?.admin_level, e.center);
  } else {
    console.log(
      "WAY",
      e.id,
      e.tags?.name ?? "(sin nombre)",
      e.tags?.boundary,
      e.tags?.highway ?? "",
      e.tags?.waterway ?? "",
    );
    for (const g of e.geometry ?? []) console.log("   ", g.lat.toFixed(6), g.lon.toFixed(6));
  }
}
