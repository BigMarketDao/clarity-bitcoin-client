import * as btc from "@scure/btc-signer";
import type { SegwitData, TxForClarityBitcoin } from "./proof-types";
/**
 * If the hashes length is not even, then it copies the last hash and adds it to the
 * end of the array, so it can be hashed with itself.
 * @param {Array<string>} hashes
 */
export declare function ensureEven(hashes: Array<string>): void;
export declare function coinbaseWitness(parsedCTx: btc.Transaction): {
    witnessReservedValue: string;
    witnessMerkleRoot: string;
};
export declare function ensure32Bytes(hexStr: string): string;
export declare function extractProofInfo(tx: TxForClarityBitcoin, clarityBitcoinContract: string): SegwitData;
