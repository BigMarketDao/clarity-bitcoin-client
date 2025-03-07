import { bufferCV, Cl, cvToJSON, deserializeCV, serializeCV } from "@stacks/transactions";
import { sha256 } from "@noble/hashes/sha256";
import { hex } from "@scure/base";
import type { SegwitData } from "./proof-types";

const getParams = (contract: string, functionName: string, functionArgs: Array<string>) => {
  return {
    contractAddress: contract.split(".")[0],
    contractName: contract.split(".")[1],
    functionName,
    functionArgs,
  };
};

export const verifyMerkleCoinbaseProof = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [
    `0x${serializeCV(Cl.bufferFromHex(proof.txId0Reversed))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.merkleRoot))}`,
    `0x${serializeCV(Cl.tuple({ "tx-index": Cl.uint(0), hashes: Cl.list(proof.cproof.map((o) => Cl.bufferFromHex(o))), "tree-depth": Cl.uint(proof.treeDepth) }))}`,
  ];
  const result = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-merkle-proof", functionArgs));
  return result.value.value;
};

export const verifyMerkleProof = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [
    `0x${serializeCV(Cl.bufferFromHex(proof.txIdReversed))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.merkleRoot))}`,
    `0x${serializeCV(Cl.tuple({ "tx-index": Cl.uint(proof.txIndex), hashes: Cl.list(proof.wproof.map((o) => Cl.bufferFromHex(o))), "tree-depth": Cl.uint(proof.treeDepth) }))}`,
  ];
  const result = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-merkle-proof", functionArgs));
  return result.value.value;
};

export const wasSegwitTxMinedCompact = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [
    `0x${serializeCV(Cl.uint(proof.height))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.wtxHex))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.header))}`,
    `0x${serializeCV(Cl.uint(proof.txIndex))}`,
    `0x${serializeCV(Cl.uint(proof.treeDepth))}`,
    `0x${serializeCV(Cl.list(proof.wproof.map((o) => Cl.bufferFromHex(o))))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.witnessMerkleRoot))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.witnessReservedValue))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.ctxHex))}`,
    `0x${serializeCV(Cl.list(proof.cproof.map((o) => Cl.bufferFromHex(o))))}`,
  ];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "was-segwit-tx-mined-compact", functionArgs));
  let result = response.value?.value || response.value;
  if (!result.success) {
    return { mined: false, Result: result, success: result.success };
  }
  console.log("wasTxMinedCompact: ", result);
  return { mined: result.success, Result: result, success: result.success };
};

export const wasTxMinedCompact = async (stacksApi: string, proof: SegwitData) => {
  console.log("Header Before Sending to Contract:", proof.header);
  console.log("Double SHA256:", sha256(sha256(hex.decode(proof.header))));
  console.log("Expected Hash from API:", proof.header);

  const functionArgs = [
    `0x${serializeCV(Cl.uint(proof.height))}`,
    `0x${serializeCV(Cl.bufferFromHex(proof.txHex))}`,
    `0x${serializeCV(bufferCV(hex.decode(proof.header)))}`,
    `0x${serializeCV(Cl.tuple({ "tx-index": Cl.uint(proof.txIndex), "tree-depth": Cl.uint(proof.treeDepth), hashes: Cl.list(proof.wproof.map((o) => Cl.bufferFromHex(o))) }))}`,
  ];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "was-tx-mined-compact", functionArgs));
  let result = (response.value?.value || response.value) as string;
  if (!response.success) {
    return { mined: false, Result: result, success: response.success };
  }
  console.log("wasTxMinedCompact: ", result);
  result = result.substring(2);
  return { mined: result === proof.txId, Result: result, success: response.success };
};

export const verifyBlockHeader = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [`0x${serializeCV(bufferCV(hex.decode(proof.header)))}`, `0x${serializeCV(Cl.uint(proof.height))}`];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "verify-block-header", functionArgs));
  let result = (response.value?.value || response.value) as string;
  return result;
};
export const getBcHHash = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [`0x${serializeCV(Cl.uint(proof.height))}`];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "get-bc-h-hash", functionArgs));
  let result = (response.value?.value || response.value) as string;
  return result;
};
export const parseBlockHeader = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [`0x${serializeCV(Cl.bufferFromHex(proof.header))}`];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-block-header", functionArgs));
  let result = (response.value?.value || response.value) as string;
  return result;
};
export const parseTx = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [`0x${serializeCV(Cl.bufferFromHex(proof.txHex))}`];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-tx", functionArgs));
  let result = (response.value?.value || response.value) as string;
  return result;
};
export const parseWTx = async (stacksApi: string, proof: SegwitData) => {
  const functionArgs = [`0x${serializeCV(Cl.bufferFromHex(proof.wtxHex))}`, `0x${serializeCV(Cl.bool(true))}`];
  const response = await callContractReadOnly(stacksApi, getParams(proof.contract, "parse-wtx", functionArgs));
  let result = (response.value?.value || response.value) as string;
  return result;
};

async function callContractReadOnly(stacksApi: string, data: any) {
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
  } catch (err) {
    console.error("callContractReadOnly4: ", err);
  }
  try {
    const result = cvToJSON(deserializeCV(val.result));
    return result;
  } catch (err: any) {
    console.error("Error: callContractReadOnly: ", val);
    return val;
  }
}
