export type TxForClarityBitcoin = {
    txId: string;
    hex: string;
    whex: string;
    chex: string;
    cwhex: string;
    witnessReservedValue: string;
    witnessMerkleRoot: string;
    block: {
        id: string;
        txs: Array<string>;
        header: string;
        reversedTxIds: Array<string>;
        merkle_root: string;
        height: string;
    };
};
export type SegwitData = {
    contract: string;
    txId: string;
    txIdReversed: string;
    txId0Reversed: string;
    height: number;
    txHex: string;
    wtxHex: string;
    header: string;
    txIndex: number;
    treeDepth: number;
    wproof: Array<string>;
    merkleRoot: string;
    witnessMerkleRoot: string;
    witnessReservedValue: string;
    wctxHex: string;
    ctxHex: string;
    cproof: Array<string>;
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
