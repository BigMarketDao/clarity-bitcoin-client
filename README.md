# Clarity Bitcoin Client

Clarity Bitcoin Client is an open-source TypeScript library for interacting with the **[Clarity-Bitcoin-V5](https://explorer.hiro.so/txid/SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.clarity-bitcoin-lib-v5?chain=mainnet) contract** on the Stacks blockchain.

Given a bitcoin txid the library fetches the block and transaction data necessary to build the merkle proofs to submit to the clarity-bitcoin-lib-v5 contract.

## Installation

```sh
npm install clarity-bitcoin-client
```

## Usage

### 1. Library

```typescript
import { fetchApiData, extractProofInfo, parseWTx, type TxForClarityBitcoin } from "clarity-bitcoin-client";
const data: ProofRequest = await getProofData(req.params.txid, blockHash, getRpcParams());
const pgd: ProofGenerationData = getProofGenerationData(data);
const proof: TransactionProofSet = extractProofInfo(pgd, data);
```

The bitcoin connection parameters are expected;

```
rpcHost: CONFIG.rpcHost,
rpcPort: CONFIG.rpcPort,
rpcPass: CONFIG.rpcPass,
rpcUser: CONFIG.rpcUser
```

## 2. API Usage

A hosted service is avaliable [here](https://api.bigmarket.ai/bigmarket-api/clarity-bitcoin/tx/766afff2bee37fcd797f4264480e575115e96d290adea9f14c82b5b3b7da8ed3/proof)

## Test client

A svelte app using this lib is [available here](https://bigmarket.ai/tools/proofs?chain=mainnet).

## Known Issues

1. the bitcoin node is pruned to 500 blocks roughly 3 days of transactions.

## Development

Clone the repository and install dependencies:

```sh
git clone https://github.com/BigMarketDao/clarity-bitcoin-client.git
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
