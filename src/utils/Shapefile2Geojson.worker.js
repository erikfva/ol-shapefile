import { Shapefile2Geojson, Shapefile2Dataset } from "./Shapefile2Geojson";
addEventListener("message", async (e) => {
  postMessage(JSON.stringify(await Shapefile2Geojson(e.data)));
});
