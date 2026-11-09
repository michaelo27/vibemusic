/**
 * Base chain layer.
 *
 * The relayer is the only account that needs ETH. It broadcasts
 * `VIBES.transferFrom(agent, artist, amount)` after verifying an EIP-712
 * authorization signed by the agent. The agent wallet therefore never pays gas.
 */
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  verifyMessage,
  verifyTypedData,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { TIP_TYPES, tipDomain, toTypedMessage } from '../../shared/eip712';
import type { TipAuthorization } from '../../shared/types';
import { CHAIN_ID, VIBES_DECIMALS, VIBES_TOKEN, config, type Env } from './env';
import { ApiError } from './http';

export function publicClient(env: Env) {
  return createPublicClient({
    chain: base,
    transport: http(config(env).rpcUrl, { timeout: 20_000, retryCount: 2 }),
  });
}

function requireKey(key: string | undefined, name: string): Hex {
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key.trim())) {
    throw new ApiError(
      `${name} is missing or malformed. Set it with: npx wrangler secret put ${name}`,
      500,
      'MISSING_KEY',
    );
  }
  return key.trim() as Hex;
}

export function relayerAccount(env: Env) {
  return privateKeyToAccount(requireKey(env.RELAYER_PRIVATE_KEY, 'RELAYER_PRIVATE_KEY'));
}

export function agentAccount(env: Env) {
  return privateKeyToAccount(requireKey(env.AGENT_PRIVATE_KEY, 'AGENT_PRIVATE_KEY'));
}

export function agentAddress(env: Env): Address {
  try {
    return agentAccount(env).address;
  } catch {
    return '0x0000000000000000000000000000000000000000';
  }
}

export const toWei = (amount: number | string) => parseUnits(String(amount), VIBES_DECIMALS);
export const fromWei = (wei: bigint) => formatUnits(wei, VIBES_DECIMALS);

/**
 * Serialise on-chain writes inside an isolate so two concurrent tips can't grab
 * the same relayer nonce. (KV would be racy; a module-scope promise chain is
 * enough for this workload.)
 */
let queue: Promise<unknown> = Promise.resolve();
export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export type RelayResult = { txHash: Hex; blockNumber: string | null };

/** Verify the agent's EIP-712 authorization. Pure CPU + one recover. */
export async function verifyTipAuthorization(
  env: Env,
  auth: TipAuthorization,
  signature: Hex,
): Promise<Address> {
  const expectedAgent = agentAddress(env);
  if (auth.from.toLowerCase() !== expectedAgent.toLowerCase()) {
    throw new ApiError('Authorization must be signed by the configured agent wallet', 403, 'WRONG_SIGNER');
  }

  let valid = false;
  try {
    valid = await verifyTypedData({
      address: auth.from,
      domain: tipDomain(CHAIN_ID),
      types: TIP_TYPES,
      primaryType: 'TipAuthorization',
      message: toTypedMessage(auth),
      signature,
    });
  } catch {
    valid = false;
  }

  if (!valid) throw new ApiError('Invalid EIP-712 signature', 401, 'BAD_SIGNATURE');
  return auth.from;
}

/** Verify a human wallet's jar-ownership signature (EIP-191 personal_sign). */
export async function verifyWalletSignature(address: Address, message: string, signature: Hex): Promise<boolean> {
  try {
    return await verifyMessage({ address, message, signature });
  } catch {
    return false;
  }
}

/** Relay one tip: transferFrom(agent → artist), gas paid by the relayer. */
export async function relayTip(
  env: Env,
  params: { from: Address; to: Address; amountWei: bigint },
): Promise<RelayResult> {
  const { from, to, amountWei } = params;

  return serialize(async () => {
    const pub = publicClient(env);
    const account = relayerAccount(env);

    // 1. the agent must have approved the relayer as a spender
    const allowance = (await pub.readContract({
      address: VIBES_TOKEN,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [from, account.address],
    })) as bigint;

    if (allowance < amountWei) {
      throw new ApiError(
        'The agent wallet has not approved the relayer to spend its $VIBES yet. Run `npm run agent:activate` once.',
        409,
        'NEEDS_APPROVAL',
        { spender: account.address, token: VIBES_TOKEN, allowance: fromWei(allowance) },
      );
    }

    // 2. the agent must actually hold the tokens
    const balance = (await pub.readContract({
      address: VIBES_TOKEN,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [from],
    })) as bigint;

    if (balance < amountWei) {
      throw new ApiError(
        `Agent wallet is short on $VIBES (holds ${fromWei(balance)}). Fund it and try again.`,
        409,
        'INSUFFICIENT_VIBES',
        { balance: fromWei(balance) },
      );
    }

    // 3. broadcast — the relayer's ETH pays the fee
    const wallet = createWalletClient({ account, chain: base, transport: http(config(env).rpcUrl) });
    const txHash = await wallet.writeContract({
      address: VIBES_TOKEN,
      abi: erc20Abi,
      functionName: 'transferFrom',
      args: [from, to, amountWei],
      chain: base,
      account,
    });

    // 4. wait briefly for inclusion (Base blocks are ~2s)
    let blockNumber: string | null = null;
    try {
      const receipt = await pub.waitForTransactionReceipt({ hash: txHash, timeout: 20_000, pollingInterval: 1_000 });
      if (receipt.status !== 'success') {
        throw new ApiError('The tip transaction reverted on-chain', 502, 'TX_REVERTED', { txHash });
      }
      blockNumber = receipt.blockNumber.toString();
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // timeout is fine: the tx is already broadcast, the UI can link to it
      console.warn('[vibemusic] receipt timeout', txHash, String(e));
    }

    return { txHash, blockNumber };
  });
}

/** Verify a *human* tip by re-reading the receipt and its Transfer log. */
export async function verifyHumanTip(
  env: Env,
  params: { txHash: Hex; from: Address; to: Address; amountWei: bigint },
): Promise<void> {
  const pub = publicClient(env);
  let receipt;
  try {
    receipt = await pub.getTransactionReceipt({ hash: params.txHash });
  } catch {
    throw new ApiError('Transaction not found on Base yet — give it a few seconds', 404, 'TX_NOT_FOUND');
  }
  if (receipt.status !== 'success') throw new ApiError('Transaction failed on-chain', 400, 'TX_FAILED');

  // Find a matching $VIBES Transfer(from → to, amount) log.
  const match = receipt.logs.some((log) => {
    if (log.address.toLowerCase() !== VIBES_TOKEN.toLowerCase()) return false;
    // Transfer(address,address,uint256) → topics[0] = keccak, [1] = from, [2] = to, data = amount
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    if (log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return false;
    const fromTopic = `0x${(log.topics[1] ?? '').slice(-40)}`.toLowerCase();
    const toTopic = `0x${(log.topics[2] ?? '').slice(-40)}`.toLowerCase();
    const value = BigInt(log.data ?? '0x0');
    return (
      fromTopic === params.from.toLowerCase() &&
      toTopic === params.to.toLowerCase() &&
      value >= params.amountWei
    );
  });

  if (!match) {
    throw new ApiError('No matching $VIBES transfer found in that transaction', 400, 'NO_TRANSFER');
  }
}

/** Balances + allowance for the agent console. */
export async function readAgentState(env: Env) {
  const pub = publicClient(env);
  const cfg = config(env);
  const agent = agentAddress(env);
  const relayer = (() => {
    try {
      return relayerAccount(env).address;
    } catch {
      return '0x0000000000000000000000000000000000000000' as Address;
    }
  })();

  const [balance, allowance, ethBalance] = await Promise.all([
    pub
      .readContract({ address: VIBES_TOKEN, abi: erc20Abi, functionName: 'balanceOf', args: [agent] })
      .catch(() => 0n),
    pub
      .readContract({ address: VIBES_TOKEN, abi: erc20Abi, functionName: 'allowance', args: [agent, relayer] })
      .catch(() => 0n),
    pub.getBalance({ address: relayer }).catch(() => 0n),
  ]);

  return {
    agentAddress: agent,
    relayerAddress: relayer,
    vibesBalance: fromWei(balance as bigint),
    allowance: fromWei(allowance as bigint),
    relayerEthBalance: formatUnits(ethBalance as bigint, 18),
    maxTipAmount: String(cfg.maxTipAmount),
    approved: (allowance as bigint) >= toWei(1),
    network: 'base' as const,
    chainId: CHAIN_ID,
    token: VIBES_TOKEN,
  };
}
