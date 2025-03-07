import * as btc from "@scure/btc-signer";
import type { TxOpts } from "@scure/btc-signer/transaction";
import { coinbaseWitness, ensureEven } from "./proof";
import { hex } from "@scure/base";
import type { TxForClarityBitcoin } from "./proof-types";

function reverseAndEven(txs: Array<string>) {
  const txIds = txs.map(function (tx: any) {
    return hex.encode(hex.decode(tx).reverse());
  });
  ensureEven(txIds);
  return txIds;
}

export async function fetchApiData(network: string, mempoolApi: string, txId: string): Promise<TxForClarityBitcoin> {
  const mempoolTx = (await fetchTransaction(mempoolApi, txId)) as any;
  if (!mempoolTx) {
    throw new Error("No transaction found on network " + network + " for txid: " + txId);
  }
  const blockHash = mempoolTx.status ? mempoolTx.status.block_hash : mempoolTx.blockhash;
  const block1 = await fetchBlockByHash(mempoolApi, blockHash);
  const header = await fetch80ByteBlockHeader(mempoolApi, blockHash);
  if (!header) {
    throw new Error("No header found on network " + network + " for block-hash: " + blockHash);
  }
  const txs = await fetchBlockByHashWithTransactionIds(mempoolApi, blockHash);
  const reversedTxIds = reverseAndEven(txs);

  const txHex = await fetchTransactionHex(mempoolApi, txId);
  if (!txHex) {
    throw new Error("No transaction found on network " + network + " for txid: " + txId);
  }
  const parsedTx = btc.Transaction.fromRaw(hex.decode(txHex), { allowUnknownInputs: true, allowUnknownOutputs: true });

  const ctxHex = await fetchTransactionHex(mempoolApi, txs[0]); // Coinbase tx is always first
  if (!ctxHex) {
    throw new Error("No coinbase transaction found on network " + network + " for txid: " + txs[0]);
  }
  const o: TxOpts = {} as TxOpts;
  const parsedCTx = btc.Transaction.fromRaw(hex.decode(ctxHex), { allowUnknownInputs: true, allowUnknownOutputs: true });
  const { witnessReservedValue, witnessMerkleRoot } = coinbaseWitness(parsedCTx);
  return {
    txId: txId,
    hex: hex.encode(parsedTx.toBytes(false, false)),
    whex: hex.encode(parsedTx.toBytes(true, true)),
    chex: hex.encode(parsedCTx.toBytes(false, false)),
    cwhex: hex.encode(parsedCTx.toBytes(true, true)),
    witnessReservedValue,
    witnessMerkleRoot,

    block: {
      id: block1.id,
      txs,
      header,
      reversedTxIds,
      merkle_root: block1.merkle_root,
      height: block1.height,
    },
  };
}

export async function fetchBlockByHashWithTransactionsFull(mempoolUrl: string, hash: string) {
  try {
    let url = `${mempoolUrl}/block/${hash}/txs`;
    let response = await fetch(url);
    const block = await response.json();
    return block;
  } catch (error) {
    console.error("Error fetching block timestamp:", error);
  }
}

async function fetchBlockByHashWithTransactionIds(mempoolUrl: string, hash: string) {
  try {
    let url = `${mempoolUrl}/block/${hash}/txids`;
    let response = await fetch(url);
    const block = await response.json();
    return block;
  } catch (error) {
    console.error("Error fetching block timestamp:", error);
  }
}

async function fetch80ByteBlockHeader(mempoolUrl: string, hash: string): Promise<string | undefined> {
  try {
    const url = `${mempoolUrl}/block/${hash}/raw`;
    // raw binary block data
    const response = await fetch(url);
    const rawData = new Uint8Array(await response.arrayBuffer()); // Correctly handle binary data
    // Extract the first 80 bytes (block header)
    const blockHeader = rawData.slice(0, 80);
    return hex.encode(blockHeader);
  } catch (error) {
    console.error("Error: fetch80ByteBlockHeader:", error);
  }
  return;
}

async function fetchTransactionHex(mempoolUrl: string, txid: string) {
  try {
    //https://api.blockcypher.com/v1/btc/test3/txs/<txID here>?includeHex=true
    //https://mempool.space/api/tx/15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521/hex
    const url = mempoolUrl + "/tx/" + txid + "/hex";
    const response = await fetch(url);
    const hex = await response.text();
    return hex;
  } catch (err) {
    console.log(err);
    return;
  }
}

async function fetchTransaction(mempoolUrl: string, txid: string) {
  try {
    const url = mempoolUrl + "/tx/" + txid;
    const response = await fetch(url);
    if (response.status !== 200) throw new Error("fetchTransaction: Unable to fetch transaction for: " + txid);
    const tx = await response.json();
    return tx;
  } catch (err) {
    console.log(err);
    return;
  }
}

async function fetchBlockByHash(mempoolUrl: string, hash: string) {
  try {
    let url = `${mempoolUrl}/block/${hash}`;
    let response = await fetch(url);
    const block = await response.json();
    return block;
  } catch (error) {
    console.error("Error fetching block timestamp:", error);
  }
}
