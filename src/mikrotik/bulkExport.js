const fs = require('fs');
const path = require('path');

module.exports.commander = async (command, log, reconnect) => {
  log('/system routerboard print')
  let result = (await command('/system routerboard print'));
  console.log(result);
  const info = (result.map(x => {
    return {
      key: x.split(':')[0].trim(),
      value: x.split(':')[1].trim(),
    }
  })).reduce((acc, x) => {
    acc[x.key] = x.value;
    return acc;
  }, {});
  console.log(info);
  for (const key of Object.keys(info)) {
    log(`${key}: ${info[key]}`, 1);
  }

  log('/export show-sensitive');
  result = (await command('/export show-sensitive'));
  console.log(result);
  if (!fs.existsSync(path.join(process.cwd(), './exports')))
    fs.mkdirSync(path.join(process.cwd(), './exports'));
  fs.writeFileSync(path.join(process.cwd(), `./exports/${info['serial-number']}.rsc`), result.join('\n'));
  log(`Wrote ${info['serial-number']}.rsc to exports folder`);
}