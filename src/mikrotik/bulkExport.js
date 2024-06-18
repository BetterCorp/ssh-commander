const fs = require('fs');
const path = require('path');

module.exports.commander = async (command, log, reconnect) => {
  log('/system routerboard print')
  let result = ((await command(fs.readFileSync(path.join(__dirname, './getRouterboardInfo.rsc')).toString().split('\n').join(' '))))[0];
  console.log(result);
  const info = JSON.parse(result);
  for (const key of Object.keys(info.rb)) {
    log(`RB ${key}: ${info.rb[key]}`, 1);
  }
  for (const pkg of info.sys) {
    log(`SYS ${pkg.name} v${pkg.version} is ${pkg.disabled === 'false' ? 'enabled' : 'disabled'}`, 1);
  }

  const majorVersion = parseInt(info.rb.currentFirmware.split('.')[0].trim());
  
  const cmd = majorVersion >= 7 ? '/export show-sensitive' : '/export';
  log(cmd);
  console.log(cmd);
  result = (await command(cmd));
  console.log(result);
  if (!fs.existsSync(path.join(process.cwd(), './exports')))
    fs.mkdirSync(path.join(process.cwd(), './exports'));
  fs.writeFileSync(path.join(process.cwd(), `./exports/${info['serial-number']}.rsc`), result.join('\n'));
  log(`Wrote ${info['serial-number']}.rsc to exports folder`);
  
  return info;
}