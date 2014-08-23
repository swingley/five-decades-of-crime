#!/Users/derek/.nvm/v0.10.29/bin/node

var fs = require('fs');

var inDir = "raw/";
var outDir = "data-via-node/";

// Get a list of CSV files.
fs.readdir(inDir, function(err, files) {
  var csvs = files.filter(function(f) {
    return f.indexOf(".csv") > -1;
  });
  // Clean up CSVs
  csvs.forEach(function(c) {
    fs.readFile(inDir + c, { encoding: "UTF-8" }, function(err, data){
      var lines = data.split("\n");
      // Get rid of the first three lines
      lines = lines.splice(3);
      // Use fourth line for file name
      outName = lines.shift().trim().toLowerCase().replace(/ /g, "-") + ".csv";
      // Filter out stuff that isn't data
      lines = lines.filter(function(l) {
        return l.match(/^\d{4}|^year/i);
      });
      // Write the file
      var clean = outDir + outName;
      var o = fs.createWriteStream(clean);
      lines.forEach(function(l) {
        l = l.replace(/ +/g, " ");
        o.write(l + "\n");
      });
      o.end();
      // console.log(clean + " finished.");
    });
  });
});
