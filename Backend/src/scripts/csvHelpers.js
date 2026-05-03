const fs = require('fs');
const csv = require('csv-parser');

const readCsvRows = (filePath, options = {}) => new Promise((resolve, reject) => {
  if (!fs.existsSync(filePath)) {
    return resolve([]);
  }

  const rows = [];
  fs.createReadStream(filePath)
    .pipe(csv(options))
    .on('data', (row) => rows.push(row))
    .on('end', () => resolve(rows))
    .on('error', reject);
});

module.exports = {
  readCsvRows,
};
