const fs = require('fs');
const path = require('path');
const {NodeSSH} = require('node-ssh');
const ping = require('ping');
const commanders = {
  mikrotikBulkUserUpdate: require('./mikrotik/bulkUserUpdate'),
  mikrotikBulkExport: require('./mikrotik/bulkExport'),
};

(async () => {
  if (fs.existsSync(path.join(process.cwd(), './log.txt'))) {
    console.error('MOVE log.txt TO ANOTHER LOCATION AND STORE IT AS IT MAY HAVE CREDENTIALS IN IT!!!!!!')
    process.exit(1);
  }
  if (!fs.existsSync(path.join(process.cwd(), './devices.txt'))) {
    console.log('Creating a devices.txt file for you to work with. Add your data according to it, and run this again.')
    fs.writeFileSync(path.join(process.cwd(), './devices.txt'), '# NAME,IP,PORT,USER,PASSWORD,IGNOREPING\n# ROUTER,192.168.0.1,admin,password,0\n');
    process.exit(0);
  }
  let commander = undefined;
  if (process.argv.length >= 3) {
    const cmd = process.argv[2].trim().toLowerCase();
    commander = commanders[Object.keys(commanders).find((key) => key.toLowerCase() === cmd)].commander;
  }
  if (commander === undefined) {
    console.error('What command do you want to run?');
    for (const key in commanders) {
      console.log(`${key}`.trim().toLowerCase());
    }
    process.exit(0);
  }

  const ssh = new NodeSSH();

  const devices = fs.readFileSync(path.join(process.cwd(), '../devices.txt'), 'utf8').toString().split('\n');
  let logs = [];

  for (const device of devices) {
    if (device.startsWith('#')) continue;
    if (device.length < 5) continue;

    const [name, ip, port, user, password, ignoreping] = device.split(',');
    console.log(`Connecting to ${name}`);
    logs.push(`Connecting to ${name}`);
    try {
      const pingResp = ignoreping === '1' ? true : await new Promise((resolve) => ping.sys.probe(ip, function (isAlive) {
        return resolve(isAlive);
      }));
      if (!pingResp) throw new Error('ping failed');
      let client = await ssh.connect({
        host: ip,
        port: port,
        username: user,
        password: password,
      });
      logs.push(` - connected`);
      console.log(`Connected to ${name}`);
      await commander(async (command) => {
        const response = await client.execCommand(command);
        if (response.stderr.length > 0) {
          logs.push(` - ${response.stderr}`);
          throw response;
        }
        return response.stdout.split('\r\n')
      }, (log, level = 0) => {
        let txt = ' - ';
        if (level === 1) txt += ' > ';
        if (level > 1) txt += '   '.repeat(level);
        logs.push(txt + log);
      }, async (newConfig) => {
        await client.dispose();
        console.log(`FORCE Disconnected from ${name}`);
        logs.push(`*** FORCE Disconnected from ${name} (for reconnect)`);
        client = await ssh.connect({
          host: newConfig.ip ?? ip,
          port: newConfig.port ?? port,
          username: newConfig.user ?? user,
          password: newConfig.password ?? password,
        })
        logs.push(` - RE-Connected (IP: ${newConfig.ip}, PORT: ${newConfig.port}, USER: ${newConfig.user}, PASSWORD: ${newConfig.password})`);
        console.log(`RE-Connected (IP: ${newConfig.ip}, PORT: ${newConfig.port}, USER: ${newConfig.user}, PASSWORD: ${newConfig.password})`);
      });
      client.dispose();
      console.log(`Disconnected from ${name}`);
    } catch (exc) {
      console.error(`Failed to connect to ${name}`);
      console.error(exc);
      logs.push(`Failed to connect to ${name}`);
      if (exc.toString().includes('All configured authentication methods failed'))
        logs.push(` - auth failed`);
      if (exc.toString().includes('ECONNREFUSED'))
        logs.push(` - connection refused (SSH not enabled)`);
      if (exc.toString().includes('ping failed'))
        logs.push(` - connection refused (PING FAILED)`);
    }
  }
  fs.writeFileSync(path.join(process.cwd(), './log.txt'), logs.join('\n'));
  process.exit(0);
})();