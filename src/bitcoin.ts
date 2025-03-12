import * as btc from "@scure/btc-signer";
import type { ProofRequest, ProofGenerationData, RpcTransaction } from "./proof-types";
import { hex } from "@scure/base";
import { ensureEven } from "./proof";
import { bitcoinRPC } from "./rpc";

export async function getProofDataRecent(index: number, rpcParams: any): Promise<ProofRequest> {
  const info = await bitcoinRPC("getblockchaininfo", [], rpcParams);
  const block = await bitcoinRPC("getblock", [info.bestblockhash, 2], rpcParams);
  const tx: RpcTransaction = block.tx[index];
  const blockHex = await bitcoinRPC("getblock", [info.bestblockhash, 0], rpcParams);
  const data: ProofRequest = {
    txid: tx.txid,
    block,
    blockHeader: blockHex.slice(0, 160),
  };
  return data;
}

export async function getProofData(txid: string, blockhash: string, rpcParams: any): Promise<ProofRequest> {
  console.log(txid, blockhash);
  const block = await bitcoinRPC("getblock", [blockhash, 2], rpcParams);

  const blockHex = await bitcoinRPC("getblock", [blockhash, 0], rpcParams);
  const data: ProofRequest = {
    txid,
    block,
    blockHeader: blockHex.slice(0, 160),
  };
  return data;
}

export function reverseAndEven(txs: Array<string>) {
  const txIds = txs.map(function (tx: any) {
    return hex.encode(hex.decode(tx).reverse());
  });
  ensureEven(txIds);
  return txIds;
}

export function getProofGenerationData(data: ProofRequest): ProofGenerationData {
  console.log("getProofGenerationData: txid: " + data.txid);
  const header = data.blockHeader;
  const iddata = getTxDataEfficiently(data);

  const txIndex = data.block.tx.findIndex((o) => o.txid === data.txid);
  console.log("getProofGenerationData: data.tx: " + data.block.tx.length);
  console.log("getProofGenerationData: txids: " + iddata.txids.length);
  console.log("getProofGenerationData: numb txs segwit   :" + iddata.segCounter);
  // const parsedTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[txIndex].hex), { allowUnknownInputs: true, allowUnknownOutputs: true });
  const parsedCTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[0].hex), { allowUnknownInputs: true, allowUnknownOutputs: true, disableScriptCheck: true });
  const { witnessReservedValue, witnessMerkleRoot } = getCommitmentHashFromRawCtx(data.block.tx[0].hex);

  console.log("getProofGenerationData: witnessReservedValue: " + witnessReservedValue);
  console.log("getProofGenerationData: witnessMerkleRoot: " + witnessMerkleRoot);

  const txhex = data.block.tx[txIndex].hex;
  return {
    txId: data.txid,
    txhex: txhex,
    ctxhex: hex.encode(parsedCTx.toBytes(true, false)), //ctxhex, // fix for coinbase was-tx-mined
    // hex: hex.encode(parsedTx.toBytes(true, false)),
    // whex: hex.encode(parsedTx.toBytes(true, true)),
    // chex: hex.encode(parsedCTx.toBytes(true, false)),
    // cwhex: hex.encode(parsedCTx.toBytes(true, true)),
    witnessReservedValue,
    witnessMerkleRoot,

    block: {
      id: data.block.hash,
      txids: iddata.txids,
      header,
      merkle_root: data.block.merkleroot,
      height: data.block.height,
    },
  };
}

function getTxDataEfficiently(data: ProofRequest): { segCounter: number; txids: Array<{ txid: string; wtxid: string; segwit: boolean }> } {
  let segCounter = 0;
  const txids = data.block.tx.map((tx, i) => {
    // parsedCTx = btc.Transaction.fromRaw(hex.decode(data.block.tx[0].hex), { allowUnknownInputs: true, allowUnknownOutputs: true, disableScriptCheck: true });
    if (i === 0) {
      // Always set coinbase WTXID to 000...000
      //hex.encode(parsedCTx.toBytes(true, false))
      const zerohash = hex.encode(new Uint8Array(32));
      console.log("tx.hash: " + tx.hash);
      console.log("tx.txid: " + tx.txid);
      console.log("tx.zerohash: " + zerohash); // no agreement
      return {
        txid: tx.txid,
        wtxid: zerohash, //'0000000000000000000000000000000000000000000000000000000000000000',
        segwit: false,
      };
    }
    return {
      txid: tx.txid, // TXID always stays big-endian
      wtxid: tx.hash, //tx.txid === tx.hash ? tx.hash : hex.encode(hex.decode(tx.hash)), // Reverse WTXID only for SegWit TXs
      segwit: tx.txid !== tx.hash,
    };
  });

  return { txids, segCounter };
}

function getCommitmentHashFromRawCtx(ctx: string) {
  const chash = ctx.substring(ctx.indexOf("6a24aa21a9ed") + 12, ctx.indexOf("6a24aa21a9ed") + 12 + 64);
  return { witnessMerkleRoot: chash, witnessReservedValue: "0000000000000000000000000000000000000000000000000000000000000000" };
}
