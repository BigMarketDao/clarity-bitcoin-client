export type RpcBlock = {
    hash: string;
    confirmations: number;
    height: number;
    version: number;
    versionHex: string;
    merkleroot: string;
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    nTx: number;
    previousblockhash: string;
    nextblockhash: string;
    strippedsize: number;
    size: number;
    weight: number;
    tx: Array<RpcTransaction>;
};
export type RpcTransaction = {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: [
        {
            coinbase: string;
            sequence: number;
        }
    ];
    vout: [
        {
            value: number;
            n: number;
            scriptPubKey: {
                asm: string;
                desc: string;
                hex: string;
                address: string;
                type: string;
            };
        }
    ];
    hex: string;
};
export type BlockChainInfo = {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    time: number;
    mediantime: number;
    verificationprogress: number;
    initialblockdownload: boolean;
    chainwork: string;
    size_on_disk: number;
    pruned: boolean;
    pruneheight: number;
    automatic_pruning: boolean;
    prune_target_size: number;
    warnings: string;
};
export type ProofRequest = {
    txid: string;
    blockHeader: string;
    block: RpcBlock;
};
export type ProofGenerationData = {
    txId: string;
    txhex: string;
    ctxhex: string;
    witnessReservedValue: string;
    witnessMerkleRoot: string;
    block: {
        id: string;
        txids: Array<{
            txid: string;
            wtxid: string;
            segwit: boolean;
        }>;
        header: string;
        merkle_root: string;
        height: number;
    };
};
export type TransactionProofSet = {
    contract?: string;
    txId: string;
    txIdReversed: string;
    txId0Reversed: string;
    height: number;
    txHex: string;
    header: string;
    txIndex: number;
    treeDepth: number;
    wproof: Array<string>;
    merkleRoot: string;
    computedWtxidRoot?: string;
    witnessMerkleRoot?: string;
    witnessReservedValue?: string;
    ctxHex: string;
    cproof: Array<string>;
    segwit: boolean;
    wtxidR: string;
    wtxid: string;
};
export type SegwitProof = {
    proof: Array<string>;
    merkleRoot: string;
};
export type TxMinedParameters = {
    merkleRoot: string;
    wproof: Array<string>;
    cproof: Array<string>;
    height: number;
    txIndex: number;
    headerHex: string;
    txIdR: string;
    treeDepth: number;
};
//# sourceMappingURL=proof-types.d.ts.map