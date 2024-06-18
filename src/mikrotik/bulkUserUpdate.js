const fs = require('fs');
const path = require('path');
const bulkExport = require('./bulkExport');

module.exports.commander = async (command, log, reconnect, config) => {
  log('/user print');
  result = ((await command(fs.readFileSync(path.join(__dirname, './getUsers.rsc')).toString().split('\n').join(' '))))[0];
  console.log(result);
  const users = JSON.parse(result);
  console.log(users);
  for (const user of users) {
    log(`(${user.id}) ${user.name}: ${user.group} (LLI: ${user.lastLoggedIn})`, 1);
  }

  if (users.find(x => x.name === config.username).group !== 'full') {
    log(`WARN - User ${config.username} is not a full user, unable to perform actions... will try export!`);
  }

  const info = await bulkExport.commander(command, log, reconnect, config);
  const majorVersion = parseInt(info.rb.currentFirmware.split('.')[0].trim());

  if (users.find(x => x.name === config.username).group !== 'full') {
    log(`User ${config.username} is not a full user, unable to perform actions!`);
    throw new Error('User is not a full user');
  }

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
  result = ((await command(fs.readFileSync(path.join(__dirname, './getActiveUsers.rsc')).toString().split('\n').join(' '))))[0];
  console.log(result);
  const activeUsers = JSON.parse(result);
  console.log(activeUsers);
  if (majorVersion >= 7) {
    for (const user of activeUsers) {
      log(`Active session: ${user.name} from ${user.address} with ${user.via}`, 1);
      if (user.name === newUser) continue;
      log(`Removing active session [${user.id}]${user.name}`, 1);
      console.log(await command(`/user active request-logout numbers=${user.id}`));
      log(`Removed active session [${user.id}]${user.name}`, 1);
    }
  } else {
    console.log('WARNING - VERSION DOES NOT SUPPORT KICKING ACTIVE SESSIONS');
    log('WARNING - VERSION DOES NOT SUPPORT KICKING ACTIVE SESSIONS');
  }

  log('Cleaning up users');
  for (const user of users) {
    if (user.name === newUser) continue;
    log(`Removing user ${user.name}`, 1);
    console.log(await command(`/user remove ${user.id}`));
    log(`Removed user ${user.name}`, 2);
  }
}