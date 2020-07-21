import { getFileExtension } from "../mapshaper/src/utils/mapshaper-filename-utils";
import { importContent } from "../mapshaper/src/io/mapshaper-import";
//import { exportFileContent } from "../mapshaper/src/io/mapshaper-export";
import { exportDatasetAsGeoJSON } from "../mapshaper/src/geojson/geojson-export";

const readFileContent = function (file, opt) {
  let defautOpt = { text: false, encode: "UTF-8" };

  opt = opt ? Object.assign(defautOpt, opt) : defautOpt;

  const process = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
    opt.text
      ? reader.readAsText(file)
      : reader.readAsArrayBuffer(file, opt.encode);
  });
  return process;
};

const readShapefile = function (files) {
  console.log("init readShapefile", new Date().toLocaleTimeString());
  //console.log(files);
  const process = new Promise((resolve, reject) => {
    let output = {};
    let count = files.length;
    function done() {
      if (count == 0) {
        console.log("finish readShapefile", new Date().toLocaleTimeString());
        resolve(output);
      }
    }
    done();

    files.forEach((file) => {
      /*
      console.log(
        new Date().toLocaleTimeString(),
        "readFileContent",
        file,
        name
      );
      */

      readFileContent(file.content, {
        text: getFileExtension(file.name) == "prj",
      })
        .then((content) => {
          output[getFileExtension(file.name)] = {
            filename: file.name,
            content,
          };
          //console.log("content", content);
          count--;
          done();
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  });
  return process;
};

const Shapefile2Dataset = async function (files) {
  console.log("init Shapefile2Geojson", new Date().toLocaleTimeString());
  let input = await readShapefile(files);

  console.log("init importContent", new Date().toLocaleTimeString());
  let dataset = importContent(input, {
    encoding: "UTF-8",
    no_topology: true,
  });
  console.log("finish importContent", new Date().toLocaleTimeString());
  return dataset;
};

const Shapefile2Geojson = async function (files) {
  console.log("init Shapefile2Geojson", new Date().toLocaleTimeString());
  let input = await readShapefile(files);

  console.log("init importContent", new Date().toLocaleTimeString());
  let out = importContent(input, {
    encoding: "UTF-8",
    no_topology: true,
  });
  console.log("finish importContent", out, new Date().toLocaleTimeString());

  console.log("init exportDatasetAsGeoJSON", new Date().toLocaleTimeString());
  let geojson = exportDatasetAsGeoJSON(out, { format: "geojson" });
  console.log("finish exportDatasetAsGeoJSON", new Date().toLocaleTimeString());

  //let geojsonFiles = exportFileContent(out, { format: "geojson" });
  //return geojsonFiles[0].content;
  //let geojson = JSON.parse(geojsonFiles[0].content);
  console.log("finish Shapefile2Geojson", new Date().toLocaleTimeString());
  return geojson;
};
export { Shapefile2Geojson, Shapefile2Dataset, readShapefile };
