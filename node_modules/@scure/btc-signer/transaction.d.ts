import * as P from 'micro-packed';
import { type CustomScript } from './payment.js';
import * as psbt from './psbt.js';
import * as u from './utils.js';
import { type Bytes } from './utils.js';
interface HDKey {
    publicKey: Bytes;
    privateKey: Bytes;
    fingerprint: number;
    derive(path: string): HDKey;
    deriveChild(index: number): HDKey;
    sign(hash: Bytes): Bytes;
}
export type Signer = Bytes | HDKey;
export declare const PRECISION = 8;
export declare const DEFAULT_VERSION = 2;
export declare const DEFAULT_LOCKTIME = 0;
export declare const DEFAULT_SEQUENCE = 4294967295;
export declare const Decimal: P.Coder<bigint, string>;
export declare const def: <T>(value: T | undefined, def: T) => T;
export declare function cloneDeep<T>(obj: T): T;
export interface TxOpts {
    version?: number;
    lockTime?: number;
    PSBTVersion?: number;
    /** @deprecated Use `allowUnknownOutputs` */
    allowUnknowOutput?: boolean;
    allowUnknownOutputs?: boolean;
    /** @deprecated Use `allowUnknownInputs` */
    allowUnknowInput?: boolean;
    allowUnknownInputs?: boolean;
    disableScriptCheck?: boolean;
    bip174jsCompat?: boolean;
    allowLegacyWitnessUtxo?: boolean;
    lowR?: boolean;
    customScripts?: CustomScript[];
    allowUnknown?: boolean;
}
/**
 * Internal, exported only for backwards-compat. Use `SigHash` instead.
 * @deprecated
 */
export declare enum SignatureHash {
    DEFAULT = 0,
    ALL = 1,
    NONE = 2,
    SINGLE = 3,
    ANYONECANPAY = 128
}
export declare enum SigHash {
    DEFAULT = 0,
    ALL = 1,
    NONE = 2,
    SINGLE = 3,
    DEFAULT_ANYONECANPAY = 128,
    ALL_ANYONECANPAY = 129,
    NONE_ANYONECANPAY = 130,
    SINGLE_ANYONECANPAY = 131
}
export type TransactionInputRequired = {
    txid: Bytes;
    index: number;
    sequence: number;
    finalScriptSig: Bytes;
};
export declare function inputBeforeSign(i: psbt.TransactionInput): TransactionInputRequired;
declare function validateOpts(opts: TxOpts): Readonly<TxOpts>;
export declare class Transaction {
    private global;
    private inputs;
    private outputs;
    readonly opts: ReturnType<typeof validateOpts>;
    constructor(opts?: TxOpts);
    static fromRaw(raw: Bytes, opts?: TxOpts): Transaction;
    static fromPSBT(psbt_: Bytes, opts?: TxOpts): Transaction;
    toPSBT(PSBTVersion?: number | undefined): Uint8Array;
    get lockTime(): number;
    get version(): number;
    private inputStatus;
    private inputSighash;
    private signStatus;
    get isFinal(): boolean;
    get hasWitnesses(): boolean;
    get weight(): number;
    get vsize(): number;
    toBytes(withScriptSig?: boolean, withWitness?: boolean): Uint8Array;
    get unsignedTx(): Bytes;
    get hex(): string;
    get hash(): string;
    get id(): string;
    private checkInputIdx;
    getInput(idx: number): psbt.TransactionInput;
    get inputsLength(): number;
    addInput(input: psbt.TransactionInputUpdate, _ignoreSignStatus?: boolean): number;
    updateInput(idx: number, input: psbt.TransactionInputUpdate, _ignoreSignStatus?: boolean): void;
    private checkOutputIdx;
    getOutput(idx: number): psbt.TransactionOutput;
    getOutputAddress(idx: number, network?: u.BTC_NETWORK): string | undefined;
    get outputsLength(): number;
    private normalizeOutput;
    addOutput(o: psbt.TransactionOutputUpdate, _ignoreSignStatus?: boolean): number;
    updateOutput(idx: number, output: psbt.TransactionOutputUpdate, _ignoreSignStatus?: boolean): void;
    addOutputAddress(address: string, amount: bigint, network?: u.BTC_NETWORK): number;
    get fee(): bigint;
    private preimageLegacy;
    preimageWitnessV0(idx: number, prevOutScript: Bytes, hashType: number, amount: bigint): Uint8Array;
    preimageWitnessV1(idx: number, prevOutScript: Bytes[], hashType: number, amount: bigint[], codeSeparator?: number, leafScript?: Bytes, leafVer?: number, annex?: Bytes): Uint8Array;
    signIdx(privateKey: Signer, idx: number, allowedSighash?: SigHash[], _auxRand?: Bytes): boolean;
    sign(privateKey: Signer, allowedSighash?: number[], _auxRand?: Bytes): number;
    finalizeIdx(idx: number): void;
    finalize(): void;
    extract(): Uint8Array;
    combine(other: Transaction): this;
    clone(): Transaction;
}
export declare function PSBTCombine(psbts: Bytes[]): Bytes;
export declare function bip32Path(path: string): number[];
export {};
//# sourceMappingURL=transaction.d.ts.map