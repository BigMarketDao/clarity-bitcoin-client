import { hex } from "@scure/base";
import { concatBytes } from "@stacks/common";
import { sha256 } from "@noble/hashes/sha256";
import { reverseAndEven } from "./bitcoin";
export function extractProofInfo(pgd, data) {
    let transactionProofSet = {};
    try {
        const targetTx = pgd.block.txids.find((o) => o.txid === pgd.txId);
        if (!targetTx)
            throw new Error("Target transaction not found in block");
        const txIndex = pgd.block.txids.findIndex((t) => t.txid === pgd.txId);
        if (txIndex === -1)
            throw new Error("Transaction not found in block!");
        const txids = pgd.block.txids.map((o) => o.txid);
        const wtxids = pgd.block.txids.map((o) => o.wtxid);
        const segwit = pgd.block.txids[txIndex].segwit;
        const reversedTxIds = reverseAndEven(txids);
        const reversedWTxIds = reverseAndEven(wtxids);
        const wtxid = wtxids[txIndex];
        const wtxidR = reversedWTxIds[txIndex];
        // ✅ Ensure we have valid inputs before calling `generateMerkleProof`
        if (!reversedTxIds[txIndex] || (segwit && !reversedWTxIds[txIndex])) {
            throw new Error("Transaction not found in the merkle tree");
        }
        const merkleRoot = generateMerkleRoot(reversedTxIds);
        const merkleHeaderRootLE = hex.encode(hex.decode(pgd.block.merkle_root).reverse());
        if (merkleHeaderRootLE !== merkleRoot) {
            throw new Error("extractProofInfo: merkleRoot mismatch");
        }
        for (let i = 0; i < 10; i++) {
            console.log(`📌 Index ${i}:`);
            console.log(`🔹 My TXID: ${txids[i]}`);
            console.log(`🔹 My TXID-R: ${reversedTxIds[i]}`);
            console.log(`🔸 My WTXID: ${wtxids[i]}`);
            console.log(`🔸 My WTXID-R: ${reversedWTxIds[i]}`);
            // // const kennyWTXID = hex.encode(calculateWTXID(data.block.tx[i].hex));
            // console.log(`💎 Kenny's Proof TXID: ${kennyWTXID}`);
            console.log("------------------------------------------------------");
        }
        // ✅ Generate Transaction Proof (wproof)
        console.log("============================================================================");
        let treeDepth = 0;
        let computedWtxidRoot;
        let wproof;
        if (segwit) {
            const wtree = generateMerkleProof(reversedWTxIds[txIndex], reversedWTxIds);
            treeDepth = wtree.treeDepth;
            wproof = wtree.merkleProof;
            computedWtxidRoot = generateMerkleRoot(reversedWTxIds);
            const commitmentHash = calculateWitnessCommitment(computedWtxidRoot, pgd.witnessReservedValue);
            pgd.witnessReservedValue = hex.encode(new Uint8Array(32)); // 32 bytes of 0x00
            console.log("extractProofInfo: Client transaction                         :" + data.txid);
            console.log("extractProofInfo: Witness Merkle Root                        :" + computedWtxidRoot);
            console.log("extractProofInfo: Witness Merkle witnessReservedValue        :" + pgd.witnessReservedValue);
            console.log("extractProofInfo: Witness Merkle commitmentHash              :" + commitmentHash);
            console.log("extractProofInfo: Witness Merkle Root witnessMerkleRoot      :" + pgd.witnessMerkleRoot);
            if (verifyWitnessCommitment(computedWtxidRoot, pgd.witnessReservedValue, pgd.witnessMerkleRoot)) {
                console.log("✅ Witness Commitment Matches!");
            }
            else {
                console.log("❌ Mismatch in Witness Commitment!");
            }
        }
        else {
            const wtree = generateMerkleProof(reversedTxIds[txIndex], reversedTxIds);
            treeDepth = wtree.treeDepth;
            wproof = wtree.merkleProof;
            const isValid = verifyMerkleProofHex(reversedTxIds[txIndex], wproof, pgd.block.merkle_root, txIndex);
            console.log("✅ Legacy proof:", isValid);
        }
        const coinbaseProof = generateMerkleProof(reversedTxIds[0], reversedTxIds);
        const cproof = coinbaseProof.merkleProof;
        let isValid = verifyMerkleProofHex(txids[0], cproof, pgd.block.merkle_root, 0);
        console.log("✅ verifyMerkleProofHex:", isValid);
        console.log("============================================================================");
        // ✅ Compute and Verify Merkle Root
        const merkleRootLE = hex.encode(hex.decode(pgd.block.merkle_root).reverse());
        if (merkleRootLE !== merkleRoot)
            throw new Error("extractProofInfo: merkleRoot mismatch");
        transactionProofSet = {
            txId: pgd.txId,
            txId0Reversed: reversedTxIds[0],
            txIdReversed: reversedTxIds[txIndex],
            wtxidR: wtxidR,
            wtxid: wtxid,
            height: Number(pgd.block.height),
            txHex: pgd.txhex,
            header: pgd.block.header,
            txIndex,
            treeDepth,
            wproof,
            merkleRoot,
            computedWtxidRoot,
            witnessReservedValue: segwit ? pgd.witnessReservedValue : undefined,
            witnessMerkleRoot: segwit ? pgd.witnessMerkleRoot : undefined,
            ctxHex: pgd.ctxhex,
            cproof,
            segwit,
        };
    }
    catch (error) {
        console.error("Error generating proof data:", error);
    }
    return transactionProofSet;
}
function calculateWitnessCommitment(witnessMerkleRoot, witnessReservedValue) {
    const rootBytes = hex.decode(witnessMerkleRoot);
    const reservedBytes = hex.decode(witnessReservedValue);
    const combined = new Uint8Array([...rootBytes, ...reservedBytes]);
    const commitmentHash = sha256(sha256(combined));
    return hex.encode(commitmentHash);
}
// function headerHex(block: any) {
//   const headerHex =
//     hex.encode(hex.decode(block.version.toString(16).padStart(8, "0")).reverse()) +
//     hex.encode(hex.decode(block.previousblockhash).reverse()) +
//     hex.encode(hex.decode(block.merkle_root).reverse()) +
//     hex.encode(hex.decode(block.timestamp.toString(16).padStart(8, "0")).reverse()) +
//     hex.encode(hex.decode(block.bits.toString(16).padStart(8, "0")).reverse()) +
//     hex.encode(hex.decode(block.nonce.toString(16).padStart(8, "0")).reverse());
//   return headerHex;
// }
const hashPair = (a, b) => {
    const bytes = concatBytes(hex.decode(a), hex.decode(b));
    const hashedBytes = sha256(sha256(bytes));
    const pair = hex.encode(hashedBytes);
    return pair;
};
/**
 * If the hashes length is not even, then it copies the last hash and adds it to the
 * end of the array, so it can be hashed with itself.
 * @param {Array<string>} hashes
 */
export function ensureEven(hashes) {
    if (hashes.length % 2 !== 0) {
        hashes.push(hashes[hashes.length - 1]);
    }
}
/**
 * Finds the index of the hash in the leaf hash list of the Merkle tree
 * and verifies if it's a left or right child by checking if its index is
 * even or odd. If the index is even, then it's a left child, if it's odd,
 * then it's a right child.
 * @param {string} hash
 * @param {Array<Array<string>>} merkleTree
 * @returns {string} direction
 */
// function getLeafNodeDirectionInMerkleTree(hash: string, merkleTree: Array<Array<string>>) {
//   const hashIndex = merkleTree[0].findIndex((h: string) => h === hash);
//   return hashIndex % 2 === 0 ? LEFT : RIGHT;
// }
/**
 * Generates the Merkle root of the hashes passed through the parameter.
 * Recursively concatenates pair of hashes and calculates each sha256 hash of the
 * concatenated hashes until only one hash is left, which is the Merkle root, and returns it.
 * @param {Array<string>} hashes
 * @returns merkleRoot
 */
function generateMerkleRoot(hashes) {
    if (!hashes || hashes.length == 0) {
        return "";
    }
    ensureEven(hashes);
    const combinedHashes = [];
    for (let i = 0; i < hashes.length; i += 2) {
        const hashPairConcatenated = hashPair(hashes[i], hashes[i + 1]);
        combinedHashes.push(hashPairConcatenated);
    }
    // If the combinedHashes length is 1, it means that we have the merkle root already
    // and we can return
    if (combinedHashes.length === 1) {
        console.log("generateMerkleRoot: ", combinedHashes);
        return combinedHashes.join("");
    }
    return generateMerkleRoot(combinedHashes);
}
/**
 * Creates a Merkle tree, recursively, from the provided hashes, represented
 * with an array of arrays of hashes/nodes. Where each array in the array, or hash list,
 * is a tree level with all the hashes/nodes in that level.
 * In the array at position tree[0] (the first array of hashes) there are
 * all the original hashes.
 * In the array at position tree[1] there are the combined pair or sha256 hashes of the
 * hashes in the position tree[0], and so on.
 * In the last position (tree[tree.length - 1]) there is only one hash, which is the
 * root of the tree, or Merkle root.
 * @param {Array<string>} hashes
 * @returns {Array<Array<string>>} merkleTree
 */
export function generateMerkleTree(hashes) {
    if (!hashes || hashes.length === 0) {
        return [];
    }
    const tree = [hashes];
    let leaves = true;
    const generate = (hashes, tree) => {
        if (hashes.length === 1) {
            return hashes;
        }
        ensureEven(hashes);
        const combinedHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            //const hashesConcatenated = hashes[i] + hashes[i + 1];
            //const hash = hex.encode(doubleSha(hashesConcatenated));
            let hashPairConcatenated;
            if (leaves) {
                hashPairConcatenated = hashPair(hashes[i], hashes[i + 1]);
            }
            else {
                hashPairConcatenated = hashPair(hashes[i], hashes[i + 1]);
            }
            combinedHashes.push(hashPairConcatenated);
        }
        tree.push(combinedHashes);
        leaves = false;
        return generate(combinedHashes, tree);
    };
    generate(hashes, tree);
    return tree;
}
/**
 * Generates the Merkle proof by first creating the Merkle tree,
 * and then finding the hash index in the tree and calculating if it's a
 * left or right child (since the hashes are calculated in pairs,
 * hthe dash at index 0 would be a left child, the hash at index 1 would be a right child.
 * Even indices are left children, odd indices are right children),
 * then it finds the sibling node (the one needed to concatenate and hash it with the child node)
 * and adds it to the proof, with its direction (left or right)
 * then it calculates the position of the next node in the next level, by
 * dividing the child index by 2, so this new index can be used in the next iteration of the
 * loop, along with the level.
 * If we check the result of this representation of the Merkle tree, we notice that
 * The first level has all the hashes, an even number of hashes.
 * All the levels have an even number of hashes, except the last one (since is the
 * Merkle root)
 * The next level have half or less hashes than the previous level, which allows us
 * to find the hash associated with the index of a previous hash in the next level in constant time.
 * Then we simply return this Merkle proof.
 * @param {string} hash
 * @param {Array<string>} hashes
 * @returns {Array<node>} merkleProof
 */
export function generateMerkleProof(hash, hashes) {
    const tree = generateMerkleTree(hashes);
    const treeDepth = tree.length - 1; // Should match proof length
    const merkleProof = [];
    let hashIndex = tree[0].findIndex((h) => h === hash);
    for (let level = 0; level < treeDepth; level++) {
        // Stop at treeDepth
        const isLeftChild = hashIndex % 2 === 0;
        const siblingIndex = isLeftChild ? hashIndex + 1 : hashIndex - 1;
        // Ensure the sibling exists before adding it to the proof
        if (siblingIndex < tree[level].length) {
            merkleProof.push(tree[level][siblingIndex]);
        }
        hashIndex = Math.floor(hashIndex / 2);
    }
    if (merkleProof.length !== treeDepth) {
        throw new Error(`Proof length mismatch: expected ${treeDepth}, got ${merkleProof.length}`);
    }
    return { merkleProof, treeDepth };
}
function verifyWitnessCommitment(witnessMerkleRoot, witnessReservedValue, expectedCommitment) {
    // Decode hex values
    const rootBytes = hex.decode(witnessMerkleRoot);
    const reservedBytes = hex.decode(witnessReservedValue);
    // Concatenate and compute double SHA256
    const commitmentHash = sha256(sha256(new Uint8Array([...rootBytes, ...reservedBytes])));
    // Compare with extracted witness commitment
    return hex.encode(commitmentHash) === expectedCommitment;
}
// function convertToMerkleProofSteps(hashes: string[]): MerkleProofStep[] {
// 	return hashes.map((hash, index) => ({
// 		position: index % 2 === 0 ? 'left' : 'right',
// 		data: Buffer.from(hex.decode(hash))
// 	}));
// }
/**
 * Verifies a Merkle proof using hex-encoded inputs.
 * @param txHashHex - The hex-encoded transaction hash (little-endian).
 * @param proofHexArray - An array of hex-encoded proof hashes.
 * @param merkleRootHex - The hex-encoded expected Merkle root (little-endian).
 * @param txIndex - The index of the transaction in the Merkle tree.
 * @returns {boolean} - True if proof is valid, false otherwise.
 */
function verifyMerkleProofHex(txHashHex, proofHexArray, merkleRootHex, txIndex) {
    // Convert hex to buffers
    let currentHash = Buffer.from(hex.decode(txHashHex)); // .reverse(); // Reverse for internal byte order
    const merkleRoot = Buffer.from(hex.decode(merkleRootHex)); //.reverse(); // Reverse root for Bitcoin order
    // Process proof hashes
    for (let i = 0; i < proofHexArray.length; i++) {
        const proofHash = Buffer.from(hex.decode(proofHexArray[i])); // .reverse(); // Reverse proof elements
        const isRightNode = (txIndex >> i) & 1;
        // Concatenate in the correct order
        const combined = isRightNode
            ? Buffer.concat([proofHash, currentHash]) // txHash is left, proofHash is right
            : Buffer.concat([currentHash, proofHash]); // txHash is right, proofHash is left
        // Hash the combined buffer
        currentHash = Buffer.from(sha256(sha256(combined)));
    }
    // Compare the final computed root with the expected Merkle root
    return currentHash.equals(merkleRoot);
}
//# sourceMappingURL=proof.js.map