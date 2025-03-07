"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWTx = exports.parseTx = exports.parseBlockHeader = exports.getBcHHash = exports.verifyBlockHeader = exports.wasTxMinedCompact = exports.wasSegwitTxMinedCompact = exports.verifyMerkleProof = exports.verifyMerkleCoinbaseProof = void 0;
const transactions_1 = require("@stacks/transactions");
const sha256_1 = require("@noble/hashes/sha256");
const base_1 = require("@scure/base");
const getParams = (contract, functionName, functionArgs) => {
    return {
        contractAddress: contract.split(".")[0],
        contractName: contract.split(".")[1],
        functionName,
        functionArgs,
    };
};
const verifyMerkleCoinbaseProof = async (stacksApi, proof) => {
    const functionArgs = [
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.txId0Reversed))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.merkleRoot))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.tuple({ "tx-index": transactions_1.Cl.uint(0), hashes: transactions_1.Cl.list(proof.cproof.map((o) => transactions_1.Cl.bufferFromHex(o))), "tree-depth": transactions_1.Cl.uint(proof.treeDepth) }))}`,
    ];
    const result = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-merkle-proof", functionArgs));
    return result.value.value;
};
exports.verifyMerkleCoinbaseProof = verifyMerkleCoinbaseProof;
const verifyMerkleProof = async (stacksApi, proof) => {
    const functionArgs = [
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.txIdReversed))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.merkleRoot))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.tuple({ "tx-index": transactions_1.Cl.uint(proof.txIndex), hashes: transactions_1.Cl.list(proof.wproof.map((o) => transactions_1.Cl.bufferFromHex(o))), "tree-depth": transactions_1.Cl.uint(proof.treeDepth) }))}`,
    ];
    const result = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-merkle-proof", functionArgs));
    return result.value.value;
};
exports.verifyMerkleProof = verifyMerkleProof;
const wasSegwitTxMinedCompact = async (stacksApi, proof) => {
    const functionArgs = [
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.height))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.wtxHex))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.header))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.txIndex))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.treeDepth))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.list(proof.wproof.map((o) => transactions_1.Cl.bufferFromHex(o))))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.witnessMerkleRoot))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.witnessReservedValue))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.ctxHex))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.list(proof.cproof.map((o) => transactions_1.Cl.bufferFromHex(o))))}`,
    ];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "was-segwit-tx-mined-compact", functionArgs));
    let result = response.value?.value || response.value;
    if (!result.success) {
        return { mined: false, Result: result, success: result.success };
    }
    console.log("wasTxMinedCompact: ", result);
    return { mined: result.success, Result: result, success: result.success };
};
exports.wasSegwitTxMinedCompact = wasSegwitTxMinedCompact;
const wasTxMinedCompact = async (stacksApi, proof) => {
    console.log("Header Before Sending to Contract:", proof.header);
    console.log("Double SHA256:", (0, sha256_1.sha256)((0, sha256_1.sha256)(base_1.hex.decode(proof.header))));
    console.log("Expected Hash from API:", proof.header);
    const functionArgs = [
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.height))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.txHex))}`,
        `0x${(0, transactions_1.serializeCV)((0, transactions_1.bufferCV)(base_1.hex.decode(proof.header)))}`,
        `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.tuple({ "tx-index": transactions_1.Cl.uint(proof.txIndex), "tree-depth": transactions_1.Cl.uint(proof.treeDepth), hashes: transactions_1.Cl.list(proof.wproof.map((o) => transactions_1.Cl.bufferFromHex(o))) }))}`,
    ];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "was-tx-mined-compact", functionArgs));
    let result = (response.value?.value || response.value);
    if (!response.success) {
        return { mined: false, Result: result, success: response.success };
    }
    console.log("wasTxMinedCompact: ", result);
    result = result.substring(2);
    return { mined: result === proof.txId, Result: result, success: response.success };
};
exports.wasTxMinedCompact = wasTxMinedCompact;
const verifyBlockHeader = async (stacksApi, proof) => {
    const functionArgs = [`0x${(0, transactions_1.serializeCV)((0, transactions_1.bufferCV)(base_1.hex.decode(proof.header)))}`, `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.height))}`];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-block-header", functionArgs));
    let result = (response.value?.value || response.value);
    return result;
};
exports.verifyBlockHeader = verifyBlockHeader;
const getBcHHash = async (stacksApi, proof) => {
    const functionArgs = [`0x${(0, transactions_1.serializeCV)(transactions_1.Cl.uint(proof.height))}`];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "get-bc-h-hash", functionArgs));
    let result = (response.value?.value || response.value);
    return result;
};
exports.getBcHHash = getBcHHash;
const parseBlockHeader = async (stacksApi, proof) => {
    const functionArgs = [`0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.header))}`];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-block-header", functionArgs));
    let result = (response.value?.value || response.value);
    return result;
};
exports.parseBlockHeader = parseBlockHeader;
const parseTx = async (stacksApi, proof) => {
    const functionArgs = [`0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.txHex))}`];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-tx", functionArgs));
    let result = (response.value?.value || response.value);
    return result;
};
exports.parseTx = parseTx;
const parseWTx = async (stacksApi, proof) => {
    const functionArgs = [`0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bufferFromHex(proof.wtxHex))}`, `0x${(0, transactions_1.serializeCV)(transactions_1.Cl.bool(true))}`];
    const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-wtx", functionArgs));
    let result = (response.value?.value || response.value);
    return result;
};
exports.parseWTx = parseWTx;
async function callContractReadOnly(stacksApi, data) {
    let url = `${stacksApi}/v2/contracts/call-read/${data.contractAddress}/${data.contractName}/${data.functionName}`;
    if (data.tip) {
        url += "?tip=" + data.tip;
    }
    let val;
    try {
        console.log("callContractReadOnly: url: ", url);
        const hiroApi1 = "ae4ecb7b39e8fbc0326091ddac461bc6";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hiro-api-key": hiroApi1,
            },
            body: JSON.stringify({
                arguments: data.functionArgs,
                sender: data.contractAddress,
            }),
        });
        val = await response.json();
    }
    catch (err) {
        console.error("callContractReadOnly4: ", err);
    }
    try {
        const result = (0, transactions_1.cvToJSON)((0, transactions_1.deserializeCV)(val.result));
        return result;
    }
    catch (err) {
        console.error("Error: callContractReadOnly: ", val);
        return val;
    }
}
//# sourceMappingURL=clarity-bitcoin.js.map