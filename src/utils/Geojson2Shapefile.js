import { importGeoJSON } from "../mapshaper/src/geojson/geojson-import";
import { exportFileContent } from "../mapshaper/src/io/mapshaper-export";
const Geojson2Shapefile = function (geojson, filename) {
  let process = new Promise((resolve, reject) => {
    /* console.log("init importGeoJSON", new Date().toLocaleTimeString()); */
    try {
      const dataset = importGeoJSON(geojson);
      /*     console.log(
        "finish importGeoJSON",
        new Date().toLocaleTimeString(),
        dataset
      ); */
      const outShp = exportFileContent(dataset, { format: "shapefile" });
      /* console.log(
        "finish exportFileContent",
        new Date().toLocaleTimeString(),
        outShp
      ); */
      filename &&
        outShp.forEach((file) => {
          file.filename = file.filename.replace("layer", filename);
        });
      resolve(outShp);
    } catch (error) {
      reject(error.message ? error.message : error);
    }
  });
  return process;
};

export default Geojson2Shapefile;
