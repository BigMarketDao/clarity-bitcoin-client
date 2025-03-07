"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchApiData = fetchApiData;
exports.fetchBlockByHashWithTransactionsFull = fetchBlockByHashWithTransactionsFull;
const btc = __importStar(require("@scure/btc-signer"));
const proof_1 = require("./proof");
const base_1 = require("@scure/base");
function reverseAndEven(txs) {
    const txIds = txs.map(function (tx) {
        return base_1.hex.encode(base_1.hex.decode(tx).reverse());
    });
    (0, proof_1.ensureEven)(txIds);
    return txIds;
}
async function fetchApiData(network, mempoolApi, txId) {
    const mempoolTx = (await fetchTransaction(mempoolApi, txId));
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
    const parsedTx = btc.Transaction.fromRaw(base_1.hex.decode(txHex), { allowUnknownInputs: true, allowUnknownOutputs: true });
    const ctxHex = await fetchTransactionHex(mempoolApi, txs[0]); // Coinbase tx is always first
    if (!ctxHex) {
        throw new Error("No coinbase transaction found on network " + network + " for txid: " + txs[0]);
    }
    const o = {};
    const parsedCTx = btc.Transaction.fromRaw(base_1.hex.decode(ctxHex), { allowUnknownInputs: true, allowUnknownOutputs: true });
    const { witnessReservedValue, witnessMerkleRoot } = (0, proof_1.coinbaseWitness)(parsedCTx);
    return {
        txId: txId,
        hex: base_1.hex.encode(parsedTx.toBytes(false, false)),
        whex: base_1.hex.encode(parsedTx.toBytes(true, true)),
        chex: base_1.hex.encode(parsedCTx.toBytes(false, false)),
        cwhex: base_1.hex.encode(parsedCTx.toBytes(true, true)),
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
async function fetchBlockByHashWithTransactionsFull(mempoolUrl, hash) {
    try {
        let url = `${mempoolUrl}/block/${hash}/txs`;
        let response = await fetch(url);
        const block = await response.json();
        return block;
    }
    catch (error) {
        console.error("Error fetching block timestamp:", error);
    }
}
async function fetchBlockByHashWithTransactionIds(mempoolUrl, hash) {
    try {
        let url = `${mempoolUrl}/block/${hash}/txids`;
        let response = await fetch(url);
        const block = await response.json();
        return block;
    }
    catch (error) {
        console.error("Error fetching block timestamp:", error);
    }
}
async function fetch80ByteBlockHeader(mempoolUrl, hash) {
    try {
        const url = `${mempoolUrl}/block/${hash}/raw`;
        // raw binary block data
        const response = await fetch(url);
        const rawData = new Uint8Array(await response.arrayBuffer()); // Correctly handle binary data
        // Extract the first 80 bytes (block header)
        const blockHeader = rawData.slice(0, 80);
        return base_1.hex.encode(blockHeader);
    }
    catch (error) {
        console.error("Error: fetch80ByteBlockHeader:", error);
    }
    return;
}
async function fetchTransactionHex(mempoolUrl, txid) {
    try {
        //https://api.blockcypher.com/v1/btc/test3/txs/<txID here>?includeHex=true
        //https://mempool.space/api/tx/15e10745f15593a899cef391191bdd3d7c12412cc4696b7bcb669d0feadc8521/hex
        const url = mempoolUrl + "/tx/" + txid + "/hex";
        const response = await fetch(url);
        const hex = await response.text();
        return hex;
    }
    catch (err) {
        console.log(err);
        return;
    }
}
async function fetchTransaction(mempoolUrl, txid) {
    try {
        const url = mempoolUrl + "/tx/" + txid;
        const response = await fetch(url);
        if (response.status !== 200)
            throw new Error("fetchTransaction: Unable to fetch transaction for: " + txid);
        const tx = await response.json();
        return tx;
    }
    catch (err) {
        console.log(err);
        return;
    }
}
async function fetchBlockByHash(mempoolUrl, hash) {
    try {
        let url = `${mempoolUrl}/block/${hash}`;
        let response = await fetch(url);
        const block = await response.json();
        return block;
    }
    catch (error) {
        console.error("Error fetching block timestamp:", error);
    }
}
//# sourceMappingURL=bitcoin.js.map