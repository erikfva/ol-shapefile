import { zip } from "../mapshaper/www/zip";
//import path from "path";
import { getFileExtension } from "../mapshaper/src/utils/mapshaper-filename-utils";
//Copy: "z-worker.js", "pako.deflate.js", "codecs.js", etc. in root url directory.
zip.workerScripts = {
  deflater: ["z-worker.js", "pako.deflate.js", "codecs.js"],
  inflater: ["z-worker.js", "pako.inflate.js", "codecs.js"],
};

const CompressBlobFiles = function (files) {
  let process = new Promise((resolve, reject) => {
    var toAdd = files;
    var zipWriter;
    try {
      zip.createWriter(
        new zip.BlobWriter("application/zip"),
        function (writer) {
          zipWriter = writer;
          nextFile();
        },
        zipError
      );
    } catch (e) {
      reject("This browser doesn't support Zip file creation.");
    }

    function zipError(err) {
      var str = "Error creating Zip file";
      var msg = "";
      // error events thrown by Zip library seem to be missing a message
      if (err && err.message) {
        msg = err.message;
      }
      if (msg) {
        str += ": " + msg;
      }
      reject(str);
    }

    function nextFile() {
      if (toAdd.length === 0) {
        zipWriter.close(function (blob) {
          resolve(blob);
          //saveBlobToDownloadFolder(zipfileName, blob, done);
        });
      } else {
        var obj = toAdd.pop(),
          blob = new Blob([obj.content]);
        zipWriter.add(obj.filename, new zip.BlobReader(blob), nextFile);
      }
    }
  });
  return process;
};

const isZipFile = function (file) {
  return /\.zip$/i.test(file);
};
const couldBeDsvFile = function (name) {
  var ext = getFileExtension(name);
  return /csv|tsv|txt$/.test(ext);
};

// Guess the type of a data file from file extension, or return null if not sure
const guessInputFileType = function (file) {
  var ext = getFileExtension(file),
    type = null;
  if (ext == "dbf" || ext == "shp" || ext == "prj" || ext == "shx") {
    type = ext;
  } else if (/json$/.test(ext)) {
    type = "json";
  } else if (ext == "csv" || ext == "tsv" || ext == "txt" || ext == "tab") {
    type = "text";
  }
  return type;
};
const isReadableFileType = function (filename) {
  var ext = getFileExtension(filename);
  /* console.log(
    "isReadableFileType",
    ext,
    guessInputFileType(filename),
    couldBeDsvFile(filename),
    isZipFile(filename)
  ); */
  return (
    !!guessInputFileType(filename) ||
    couldBeDsvFile(filename) ||
    isZipFile(filename)
  );
};
const UncompressBlobFile = function (file) {
  console.log("init UncompressBlobFile", new Date().toLocaleTimeString());
  const process = new Promise((resolve, reject) => {
    var _files = [];
    zip.createReader(new zip.BlobReader(file), importZipContent, onError);

    function onError(err) {
      reject(err);
    }

    function onDone() {
      // don't try to import .txt files from zip files
      // (these would be parsed as dsv and throw errows)
      _files = _files.filter(function (f) {
        return !/\.txt$/i.test(f.name);
      });
      return resolve(_files);
      /*
      if (!_files.length) return resolve(_files);
      var files = [];
      _files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          files.push({ filename: file.name, content: e.target.result });
          if (files.length == _files.length) resolve(files);
        };
        reader.readAsArrayBuffer(file);
      });
      */
    }

    function importZipContent(reader) {
      var _entries;
      reader.getEntries(readEntries);

      function readEntries(entries) {
        _entries = entries || [];
        readNext();
      }

      function readNext() {
        if (_entries.length > 0) {
          readEntry(_entries.pop());
        } else {
          reader.close();
          onDone();
        }
      }

      function readEntry(entry) {
        var filename = entry.filename,
          isValid =
            !entry.directory &&
            isReadableFileType(filename) &&
            !/^__MACOSX/.test(filename); // ignore "resource-force" files
        if (isValid) {
          entry.getData(new zip.BlobWriter(), function (file) {
            file.name = filename; // Give the Blob a name, like a File object
            _files.push(file);
            readNext();
          });
        } else {
          console.log("no valido");
          readNext();
        }
      }
    }
  });
  return process;
};

export { CompressBlobFiles, UncompressBlobFile, isZipFile };
