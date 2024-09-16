# SSH Commander

## Mikrotik

### Bulk User Update

Log into multiple mikrotik routers and create a new random user with a random password and remove all existing users.

This also runs the Bulk Export command.

### Bulk Export

Logs into multiple mikrotik routers and exports the config to a file.
  
This creates exports of the config and outputs them in `exports/{SN}.rsc`

## Config

Add devices to a file named `devices.yaml`.

Run the program to generate a default devices.yaml file for you.

## Logs

Output logs are written to `log.txt`.

# How to use

Install NodeJS on a machine, open terminal in a directory you want to use for the config, logs or exports.  
Then run `npx @bettercorp/ssh-commander` and it will create the config file devices.yaml for you - which you can edit and then just run the command again.  
If you want to script this, `npx @bettercorp/ssh-commander@{version} {command} {command args}` < lock it to the latest version and define the command and args.  
It will do the rest for you.  

## How to find the latest version?  
https://www.npmjs.com/package/@bettercorp/ssh-commander  

## How to find the commands?  
https://github.com/BetterCorp/ssh-commander/blob/master/src/index.js#L24-L26
