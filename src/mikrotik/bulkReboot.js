export const name = 'Mikrotik Bulk Reboot';
export const description = 'Logs into multiple mikrotik routers and reboots them.';
export const commander = async (WORKING_DIR, command, log, reconnect) => {
  log('/system reboot')
  let result = (await command('/system reboot'));
  console.log(result);
}