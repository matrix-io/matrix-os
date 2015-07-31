var LineByLineReader = require('line-by-line');

module.exports = {
  readLines: readLines
}

function readLines (filePath, readLineCallback, endCallback) {
    var lineByLineReader = new LineByLineReader(filePath);
    lineByLineReader.on('error', function (err) {
      error("FileManager -- Error reading line");
      error(err.stack);
      endCallback();
    });
    lineByLineReader.on('line', readLineCallback);
    lineByLineReader.on('end', function () {
      endCallback();
    });
  };
