import type { ProofRequest, ProofGenerationData } from "./proof-types";
export declare function getProofDataRecent(index: number, rpcParams: any): Promise<ProofRequest>;
export declare function getProofData(txid: string, blockhash: string, rpcParams: any): Promise<ProofRequest>;
export declare function reverseAndEven(txs: Array<string>): string[];
export declare function getProofGenerationData(data: ProofRequest): ProofGenerationData;
//# sourceMappingURL=bitcoin.d.ts.map