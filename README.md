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