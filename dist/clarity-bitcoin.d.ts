import type { SegwitData } from "./proof-types";
export declare const verifyMerkleCoinbaseProof: (stacksApi: string, proof: SegwitData) => Promise<any>;
export declare const verifyMerkleProof: (stacksApi: string, proof: SegwitData) => Promise<any>;
export declare const wasSegwitTxMinedCompact: (stacksApi: string, proof: SegwitData) => Promise<{
    mined: any;
    Result: any;
    success: any;
}>;
export declare const wasTxMinedCompact: (stacksApi: string, proof: SegwitData) => Promise<{
    mined: boolean;
    Result: string;
    success: any;
}>;
export declare const verifyBlockHeader: (stacksApi: string, proof: SegwitData) => Promise<string>;
export declare const getBcHHash: (stacksApi: string, proof: SegwitData) => Promise<string>;
export declare const parseBlockHeader: (stacksApi: string, proof: SegwitData) => Promise<string>;
export declare const parseTx: (stacksApi: string, proof: SegwitData) => Promise<string>;
export declare const parseWTx: (stacksApi: string, proof: SegwitData) => Promise<string>;
