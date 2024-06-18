# SSH Commander

## Mikrotik

### Bulk User Update

Log into multiple mikrotik routers and create a new random user with a random password and remove all existing users.

`npx @bettercorp/ssh-commander@latest MikrotikBulkUserUpdate`

This also creates exports of the config and outputs them in `exports/{SN}.rsc`

### Bulk Export

Logs into multiple mikrotik routers and exports the config to a file.

`npx @bettercorp/ssh-commander@latest MikrotikBulkExport`  
This creates exports of the config and outputs them in `exports/{SN}.rsc`

## Config

Add devices to a file named `devices.txt` in the following format:

```
# NAME,IP,PORT,USER,PASSWORD,IGNOREPING
# ROUTER,192.168.0.1,admin,password,0
```  

Lines can have comments.