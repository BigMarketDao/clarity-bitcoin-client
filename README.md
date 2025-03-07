# Clarity Bitcoin Client

Clarity Bitcoin Client is an open-source TypeScript library for interacting with the **[Clarity-Bitcoin-V5](https://explorer.hiro.so/txid/SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.clarity-bitcoin-lib-v5?chain=mainnet) contract** on the Stacks blockchain.

Given a bitcoin txid the library fetches the block and transaction data necessary to build the merkle proofs to submit to the clarity-bitcoin-lib-v5 contract.

## Installation

```sh
npm install clarity-bitcoin-client
```

## Usage

### **1️⃣ Import the Library**

```typescript
import { fetchApiData, extractProofInfo, parseWTx, type TxForClarityBitcoin } from "clarity-bitcoin-client";
const tx: TxForClarityBitcoin = await fetchApiData(network, mempoolApi, txId);
const proof: SegwitData = await extractProofInfo(tx, contractId);
const result = await parseWTx(stacksApi, proof);
```

### **2️⃣ Generate a Proof for a Bitcoin Transaction**

```typescript
const result = await verifyMerkleCoinbaseProof({});
```

### **3️⃣ Verify the Transaction Proof in Clarity**

```typescript
const isMined = await wasTxMinedCompact(proof);
console.log("Transaction Verified:", txid);
```

## Test client

A svelte app using this lib is [available here](https://bigmarket.ai/tools/proofs).

## Known Issues

1. The `was-segwit-tx-mined-compact` method fails with error 7 - on verifying coinbase
   merkle proof.
2. Breaks if you give it the coinbase transaction id

## API Reference

Works with mempool space api. future editions may work with the rpc bitcoin node
interface.

## Development

Clone the repository and install dependencies:

```sh
git clone https://github.com/your-repo/clarity-bitcoin-client.git
cd clarity-bitcoin-client
npm install
```

### **Build & Test**

```sh
npm run build  # Compile to dist/
npm test       # Run tests
```

### **Publishing to NPM**

```sh
npm run build
npm publish
```

## License

MIT

## Contributors

Open to contributions! Feel free to submit a PR. 🚀
