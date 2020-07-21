import "ol/ol.css";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import GeoJSON from "ol/format/GeoJSON";
import Circle from "ol/geom/Circle";
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Group as olGroup,
} from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

import { UncompressBlobFile, isZipFile } from "./utils/Zip";

const workerShapefile2Geojson = new Worker(
  "./utils/Shapefile2Geojson.worker.js",
  {
    type: "module",
  }
);

const addGeojsonLayer = function (olMap, geojson) {
  console.log("init addGeojsonLayer", new Date().toLocaleTimeString());

  let vectorSource = new VectorSource({
    features: new GeoJSON({
      projection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    }).readFeatures(geojson),
  });
  let vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  olMap.addLayer(vectorLayer);

  console.log("finish addGeojsonLayer", new Date().toLocaleTimeString());
};

const addGeojsonLayerPart = function (olMap, geojson) {
  console.log("init addGeojsonLayer", new Date().toLocaleTimeString());

  const addPart = function (from, to) {
    //console.log(from, to);
    let features = geojson.features.slice(from, to);
    let geojsonPart = {
      type: geojson.type,
      features,
    };
    vectorSource.addFeatures(
      new GeoJSON({
        projection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }).readFeatures(geojsonPart)
    );
  };

  let nparts = 3;
  let n = geojson.features.length;
  let dx = Math.round(n / nparts);
  let vectorSource = undefined;
  for (let i = 1; i <= nparts; i++) {
    let start = (i - 1) * dx;
    let end = i * dx;
    end = end > n ? n : end;

    if (i == 1) {
      let features = geojson.features.slice(start, end);
      let geojsonPart = {
        type: geojson.type,
        features,
      };
      vectorSource = new VectorSource({
        features: new GeoJSON({
          projection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }).readFeatures(geojsonPart),
      });
      let vectorLayer = new VectorLayer({
        source: vectorSource,
      });
      olMap.addLayer(vectorLayer);
    } else {
      addPart(start, end);
    }
  }

  console.log("finish addGeojsonLayer", new Date().toLocaleTimeString());
};

const upload = function (file) {
  const process = new Promise(async (resolve, reject) => {
    try {
      const files = await UncompressBlobFile(file);
      if (files.length == 0) {
        vc.processing = false;
        return reject("Archivo no válido.");
      }
      //console.log(files[0]);
      const files_ = files.map((el) => {
        return { name: el.name, content: el };
      });
      console.log(files_, new Date().toLocaleTimeString());

      workerShapefile2Geojson.onmessage = (e) => {
        console.log("worker", new Date().toLocaleTimeString());
        return resolve(e.data);
      };
      workerShapefile2Geojson.postMessage(files_);
    } catch (err) {
      console.log(err);
      return reject(err.message ? err.message : err);
    }
  });
  return process;
};

document.getElementById("upload").addEventListener(
  "click",
  async (e) => {
    var files = document.getElementById("files").files;
    if (!files.length) {
      alert("Please select a file!");
      return;
    }
    var file = files[0];
    if (!isZipFile(file.name)) {
      return alert("El archivo no es '.zip'");
    }
    try {
      let geojson = JSON.parse(await upload(file));
      addGeojsonLayer(map, geojson);
    } catch (error) {}

    /*
    const { geojson, err } = await upload(file);
    if (err) {
      return alert(err);
    }
    addGeojsonLayer(map, geojson);
    */
  },
  false
);
document.getElementById("clear-last").addEventListener(
  "click",
  async (e) => {
    let layer = map._layers[map._layers.length - 1];
    map.removeLayer(layer);
  },
  false
);

var image = new CircleStyle({
  radius: 5,
  fill: null,
  stroke: new Stroke({ color: "red", width: 1 }),
});

var styles = {
  Point: new Style({
    image: image,
  }),
  LineString: new Style({
    stroke: new Stroke({
      color: "green",
      width: 1,
    }),
  }),
  MultiLineString: new Style({
    stroke: new Stroke({
      color: "green",
      width: 1,
    }),
  }),
  MultiPoint: new Style({
    image: image,
  }),
  MultiPolygon: new Style({
    stroke: new Stroke({
      color: "yellow",
      width: 1,
    }),
    fill: new Fill({
      color: "rgba(255, 255, 0, 0.1)",
    }),
  }),
  Polygon: new Style({
    stroke: new Stroke({
      color: "blue",
      lineDash: [4],
      width: 3,
    }),
    fill: new Fill({
      color: "rgba(0, 0, 255, 0.1)",
    }),
  }),
  GeometryCollection: new Style({
    stroke: new Stroke({
      color: "magenta",
      width: 2,
    }),
    fill: new Fill({
      color: "magenta",
    }),
    image: new CircleStyle({
      radius: 10,
      fill: null,
      stroke: new Stroke({
        color: "magenta",
      }),
    }),
  }),
  Circle: new Style({
    stroke: new Stroke({
      color: "red",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(255,0,0,0.2)",
    }),
  }),
};

var styleFunction = function (feature) {
  return styles[feature.getGeometry().getType()];
};

var geojsonObject = {
  type: "FeatureCollection",
  crs: {
    type: "name",
    properties: {
      name: "EPSG:3857",
    },
  },
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [4e6, -2e6],
          [8e6, 2e6],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [4e6, 2e6],
          [8e6, -2e6],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5e6, -1e6],
            [-4e6, 1e6],
            [-3e6, -1e6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [-1e6, -7.5e5],
            [-1e6, 7.5e5],
          ],
          [
            [1e6, -7.5e5],
            [1e6, 7.5e5],
          ],
          [
            [-7.5e5, -1e6],
            [7.5e5, -1e6],
          ],
          [
            [-7.5e5, 1e6],
            [7.5e5, 1e6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-5e6, 6e6],
              [-5e6, 8e6],
              [-3e6, 8e6],
              [-3e6, 6e6],
            ],
          ],
          [
            [
              [-2e6, 6e6],
              [-2e6, 8e6],
              [0, 8e6],
              [0, 6e6],
            ],
          ],
          [
            [
              [1e6, 6e6],
              [1e6, 8e6],
              [3e6, 8e6],
              [3e6, 6e6],
            ],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "LineString",
            coordinates: [
              [-5e6, -5e6],
              [0, -5e6],
            ],
          },
          {
            type: "Point",
            coordinates: [4e6, -5e6],
          },
          {
            type: "Polygon",
            coordinates: [
              [
                [1e6, -6e6],
                [2e6, -4e6],
                [3e6, -6e6],
              ],
            ],
          },
        ],
      },
    },
  ],
};

var vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

vectorSource.addFeature(new Feature(new Circle([5e6, 7e6], 1e6)));

var vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
});

var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  target: "map",
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
