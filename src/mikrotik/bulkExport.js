import fs from 'fs';
import path from 'path';

export const name = 'Mikrotik Bulk Export';
export const description = 'Logs into multiple mikrotik routers and exports the config to a file.';
export const commander = async (WORKING_DIR, command, log, reconnect) => {
  log('/system routerboard print')
  let result = ((await command(fs.readFileSync(path.join(WORKING_DIR, './src/mikrotik/getRouterboardInfo.rsc')).toString().split('\n').join(' '))))[0];
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
  if (!fs.existsSync(path.join(process.cwd(), './exports'))) fs.mkdirSync(path.join(process.cwd(), './exports'));
  fs.writeFileSync(path.join(process.cwd(), `./exports/${info.rb.serialNumber}.rsc`), result.join('\n'));
  log(`Wrote ${info.rb.serialNumber}.rsc to exports folder`);

  return info;
}