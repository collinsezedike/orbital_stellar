import { loadConfig } from "./config.js";
import { connect } from "./anchor.js";
import { deposit, send } from "./commands.js";

/**
 * `orbital-anchor-starter deposit [amount]` or `... send <amount>`.
 * See README.md for the walkthrough - both commands run SEP-1 discovery and
 * SEP-10 authentication first, then the SEP-24/31 flow specific to them.
 */
async function main(): Promise<void> {
  const [command, arg] = process.argv.slice(2);
  const log = (message: string) => console.log(message);

  const config = loadConfig();
  log(`Connecting to ${config.homeDomain} as ${config.assetCode}...`);
  const session = await connect(config);
  log(`Authenticated as ${session.publicKey}.`);

  switch (command) {
    case "deposit":
      await deposit(session, config, arg, log);
      return;
    case "send":
      if (!arg) {
        console.error("Usage: orbital-anchor-starter send <amount>");
        process.exit(1);
      }
      await send(session, config, arg, log);
      return;
    default:
      console.error("Usage: orbital-anchor-starter <deposit [amount] | send <amount>>");
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("[anchor-starter] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
