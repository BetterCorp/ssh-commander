import fs from 'fs';
import path from 'path';
import {commander as bulkExport} from './bulkExport.js';
import zod from 'zod';

export const name = 'Mikrotik Bulk User Update';
export const description = 'Log into multiple mikrotik routers and create a new random user with a random password and remove all existing users.';

export const config = zod.object({
  forceReboot: zod.boolean().optional(),
  forceUpdate: zod.boolean().optional(),
}).default({
  forceReboot: false,
  forceUpdate: false,
});
export const commander = async (WORKING_DIR, command, log, reconnect, config) => {
  log('/user print');
  let result = ((await command(fs.readFileSync(path.join(WORKING_DIR, './getUsers.rsc')).toString().split('\n').join(' '))))[0];
  console.log(result);
  const users = JSON.parse(result);
  console.log(users);
  for (const user of users) {
    log(`(${user.id}) ${user.name}: ${user.group} (LLI: ${user.lastLoggedIn})`, 1);
  }

  if (users.find(x => x.name === config.user).group !== 'full') {
    log(`WARN - User ${config.user} is not a full user, unable to perform actions... will try export!`);
  }

  const info = await bulkExport(WORKING_DIR, command, log, reconnect, config);
  const majorVersion = parseInt(info.rb.currentFirmware.split('.')[0].trim());

  if (users.find(x => x.name === config.user).group !== 'full') {
    log(`User ${config.user} is not a full user, unable to perform actions!`);
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
  result = ((await command(fs.readFileSync(path.join(WORKING_DIR, './getActiveUsers.rsc')).toString().split('\n').join(' '))))[0];
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