#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {NodeSSH} from 'node-ssh';
import ping from 'ping';
import YAML from 'yaml';
import zod from 'zod';
import inquirer from 'inquirer';

let configSchema = {
  name: zod.string().min(1).max(255).default('Device Name'),
  ip: zod.string().min(1).max(255).default('192.168.1.1'),
  port: zod.number().min(1).max(65535).default(22),
  user: zod.string().min(1).max(255).default('root'),
  password: zod.string().min(1).max(255).default('password'),
  ignorePing: zod.boolean().optional().default(false),
};

const WORKING_DIR = __dirname ?? path.join(path.resolve(path.dirname(process.argv[1])), '../');
(async () => {
  console.log('SRC Dir: ' + WORKING_DIR);
  const commanders = {
    mikrotikBulkUserUpdate: (await import('./mikrotik/bulkUserUpdate.js')),
    mikrotikBulkExport: (await import('./mikrotik/bulkExport.js')),
  };

  if (fs.existsSync(path.join(process.cwd(), './log.txt'))) {
    console.error('MOVE log.txt TO ANOTHER LOCATION AND STORE IT AS IT MAY HAVE CREDENTIALS IN IT!!!!!!')
    process.exit(1);
  }
  for (const key of Object.keys(commanders)) {
    if (commanders[key].config) {
      configSchema[key] = commanders[key].config;
    }
  }
  let defaulteSchemaConfig = {};
  for (const key of Object.keys(configSchema)) {
    if (configSchema[key].default !== undefined)
      defaulteSchemaConfig[key] = configSchema[key].parse(undefined);
    else if (Object.keys(commanders).includes(key)) {
      defaulteSchemaConfig[key] = commanders[key].config.parse(undefined);
    }
  }

  const DEFSchema = zod.object(configSchema).default(defaulteSchemaConfig);
  const SCHEMA = zod.array(DEFSchema).default([defaulteSchemaConfig, defaulteSchemaConfig]);
  if (!fs.existsSync(path.join(process.cwd(), './devices.yaml'))) {
    console.log('Creating a devices.yaml file for you to work with. Add your data according to it, and run this again.');
    fs.writeFileSync(path.join(process.cwd(), './devices.yaml'), YAML.stringify(SCHEMA.parse(undefined)));
    process.exit(0);
  }
  let commander = undefined;
  if (process.argv.length >= 3) {
    const cmd = process.argv[2].trim().toLowerCase();
    commander = commanders[Object.keys(commanders).find((key) => key.toLowerCase() === cmd)];
    commander = commander?.commander;
  } else {
    const prompt = await inquirer.prompt([
      {
        type: 'list', choices: Object.keys(commanders).map(x => ({
          name: `${commanders[x].name ?? x} (${commanders[x].description ?? 'no description'})`,
          value: x
        })), name: 'command'
      },
    ]);
    commander = commanders[prompt.command];
    commander = commander?.commander;
  }
  if (commander === undefined) {
    console.error('What command do you want to run?');
    for (const key in commanders) {
      console.log(`${key}`.trim().toLowerCase());
    }
    process.exit(0);
  }

  const ssh = new NodeSSH();

  const devices = SCHEMA.parse(YAML.parse(fs.readFileSync(path.join(process.cwd(), './devices.yaml'), 'utf8')));
  let logs = [];

  for (const device of devices) {
    console.log(`Connecting to ${device.name}`);
    logs.push(`Connecting to ${device.name}`);
    try {
      const pingResp = device.ignorePing === true ? true : await new Promise((resolve) => ping.sys.probe(device.ip, function (isAlive) {
        return resolve(isAlive);
      }));
      if (!pingResp) throw new Error('ping failed');
      let client = await ssh.connect({
        host: device.ip,
        port: device.port,
        username: device.user,
        password: device.password,
      });
      logs.push(` - connected`);
      console.log(`Connected to ${device.name}`);
      await commander(WORKING_DIR, async (command) => {
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
        console.log(`FORCE Disconnected from ${device.name}`);
        logs.push(`*** FORCE Disconnected from ${device.name} (for reconnect)`);
        client = await ssh.connect({
          host: newConfig.ip ?? device.ip,
          port: newConfig.port ?? device.port,
          username: newConfig.user ?? device.user,
          password: newConfig.password ?? device.password,
        })
        logs.push(` - RE-Connected (IP: ${newConfig.ip ?? device.ip}, PORT: ${newConfig.port ?? device.port}, USER: ${newConfig.user ?? device.user}, PASSWORD: ${newConfig.password ?? device.password})`);
        console.log(`RE-Connected (IP: ${newConfig.ip ?? device.ip}, PORT: ${newConfig.port ?? device.port}, USER: ${newConfig.user ?? device.user}, PASSWORD: ${newConfig.password ?? device.password})`);
      }, device);
      client.dispose();
      console.log(`Disconnected from ${device.name}`);
    } catch (exc) {
      console.error(`Failed to connect to ${device.name}`);
      console.error(exc);
      logs.push(`Failed to connect to ${device.name}`);
      if (exc.toString().includes('All configured authentication methods failed'))
        logs.push(` - auth failed`);
      if (exc.toString().includes('ECONNREFUSED'))
        logs.push(` - connection refused (SSH not enabled)`);
      if (exc.toString().includes('ping failed'))
        logs.push(` - connection refused (PING FAILED)`);
    }
  }
  fs.writeFileSync(path.join(process.cwd(), './log.txt'), logs.join('\n'));
  console.log('Done');
  process.exit(0);
})();