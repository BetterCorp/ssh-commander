module.exports.parseColumnData = (dataRaw) => {
  const data = dataRaw.flat(Infinity);
  if (data[0].indexOf('Columns') === 0) data.shift();
  // Extract column names from the second line (header row)
  const headerRow = data[0].trim();

  // Determine the positions of each column based on spaces in the header row
  const columns = headerRow.split(/\s+/);
  const positions = [];

  let currentPos = 0;
  columns.forEach(col => {
    positions.push(headerRow.indexOf(col, currentPos));
    currentPos = headerRow.indexOf(col, currentPos) + col.length;
  });

  // Extract rows of data
  const rows = data.slice(1);

  // Parse each row into an object
  const result = rows.map(row => {
    let obj = {};
    columns.forEach((col, index) => {
      if (index === columns.length - 1) {
        // For the last column, take the substring from the start position to the end of the line
        obj[col] = row.slice(positions[index]).trim();
      } else {
        // For other columns, take the substring from start position to the start position of the next column
        obj[col] = row.slice(positions[index], positions[index + 1]).trim();
      }
    });
    return obj;
  });

  return result;
}