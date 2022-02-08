# mech-discord-bot

This project was bootstrapped using [adonisjs](https://docs.adonisjs.com/guides/introduction)

## Development

### 1. Create bot on [discord developer](https://discord.com/developers/applications)

- Click `CREATE AN APPLICATION` and fill the `Name` of the application (also the name of the discord bot)
- After that, copy the value of `APPLICATION ID`, this is the `SERVER_ID` value
- Move to the `Bot` tab, click `Add Bot`, and set the `username` for bot.
- Click `Copy` to copy the value of `BOT_TOKEN`, you can click Regenerate to regenerate another token.
- Move to OAuth2 -> URL Generator, in `SCOPES`, tick `bot` box, the `BOT PERMISSIONS` div appear, click `Administrator`, and click `Copy`
- After login with the Mech Discord account, browse the link copied above, and in `ADD TO SERVER`path, select server of MECH MASTER.
- Click `Authorize` to finish add the bot to the Server, do the capcha test to finish the process.

### 2. Set the remain env variables

- Set the value to config Postgres configuration, `WEBHOOK_API_TOKEN` for discord webhook, and `NETWORK_URL` for network RPC, `MECH_GUILD_CONTRACT` is the address of the Guild contract after being deployed, and `SIGNER_PRIVATE_KEY` is the address of the signer, will be set in the contract.

### 3. Run development

```bash
npm run dev
yarn dev
```
