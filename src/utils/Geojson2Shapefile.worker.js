import Geojson2Shapefile from "./Geojson2Shapefile";
addEventListener("message", async (e) => {
  try {
    postMessage({
      shapefile: await Geojson2Shapefile(e.data.geojson, e.data.filename),
      error: null,
    });
  } catch (error) {
    postMessage({ shapefile: null, error });
  }
});
