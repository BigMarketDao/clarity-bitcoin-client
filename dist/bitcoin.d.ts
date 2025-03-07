import type { TxForClarityBitcoin } from "./proof-types";
export declare function fetchApiData(network: string, mempoolApi: string, txId: string): Promise<TxForClarityBitcoin>;
export declare function fetchBlockByHashWithTransactionsFull(mempoolUrl: string, hash: string): Promise<any>;
