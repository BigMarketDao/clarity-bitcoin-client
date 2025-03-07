"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureEven = ensureEven;
exports.coinbaseWitness = coinbaseWitness;
exports.ensure32Bytes = ensure32Bytes;
exports.extractProofInfo = extractProofInfo;
const base_1 = require("@scure/base");
const common_1 = require("@stacks/common");
const sha256_1 = require("@noble/hashes/sha256");
const LEFT = "left";
const RIGHT = "right";
function headerHex(block) {
    const headerHex = base_1.hex.encode(base_1.hex.decode(block.version.toString(16).padStart(8, "0")).reverse()) +
        base_1.hex.encode(base_1.hex.decode(block.previousblockhash).reverse()) +
        base_1.hex.encode(base_1.hex.decode(block.merkle_root).reverse()) +
        base_1.hex.encode(base_1.hex.decode(block.timestamp.toString(16).padStart(8, "0")).reverse()) +
        base_1.hex.encode(base_1.hex.decode(block.bits.toString(16).padStart(8, "0")).reverse()) +
        base_1.hex.encode(base_1.hex.decode(block.nonce.toString(16).padStart(8, "0")).reverse());
    return headerHex;
}
// export const doubleSha = (valueToBeHashed: string): Uint8Array => {
// 	return sha256(sha256(hex.decode(valueToBeHashed))) as Uint8Array;
// };
// export const hashPairReverse = (a: string, b: string): string => {
// 	const bytes = concatBytes(hex.decode(a).reverse(), hex.decode(b).reverse());
// 	const hashedBytes = sha256(sha256(bytes));
// 	const pair = hex.encode(hashedBytes.reverse());
// 	return pair;
// };
const hashPair = (a, b) => {
    const bytes = (0, common_1.concatBytes)(base_1.hex.decode(a), base_1.hex.decode(b));
    const hashedBytes = (0, sha256_1.sha256)((0, sha256_1.sha256)(bytes));
    const pair = base_1.hex.encode(hashedBytes);
    return pair;
};
/**
 * If the hashes length is not even, then it copies the last hash and adds it to the
 * end of the array, so it can be hashed with itself.
 * @param {Array<string>} hashes
 */
function ensureEven(hashes) {
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
function getLeafNodeDirectionInMerkleTree(hash, merkleTree) {
    const hashIndex = merkleTree[0].findIndex((h) => h === hash);
    return hashIndex % 2 === 0 ? LEFT : RIGHT;
}
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
function generateMerkleTree(hashes) {
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
function generateMerkleProof(hash, hashes) {
    if (!hash || !hashes || hashes.length === 0) {
        return null;
    }
    const tree = generateMerkleTree(hashes);
    const merkleProof = [
        {
            hash,
            direction: getLeafNodeDirectionInMerkleTree(hash, tree),
        },
    ];
    let hashIndex = tree[0].findIndex((h) => h === hash);
    for (let level = 0; level < tree.length - 1; level++) {
        const isLeftChild = hashIndex % 2 === 0;
        const siblingDirection = isLeftChild ? RIGHT : LEFT;
        const siblingIndex = isLeftChild ? hashIndex + 1 : hashIndex - 1;
        const siblingNode = {
            hash: tree[level][siblingIndex],
            direction: siblingDirection,
        };
        merkleProof.push(siblingNode);
        hashIndex = Math.floor(hashIndex / 2);
    }
    return merkleProof;
}
function coinbaseWitness(parsedCTx) {
    let witnessReservedValue = "00000000000000000000000000000000";
    let witnessMerkleRoot = "00000000000000000000000000000000";
    for (let i = 0; i < parsedCTx.outputsLength; i++) {
        const output = parsedCTx.getOutput(i);
        if (output.script && output.script[0] === 0x6a) {
            // OP_RETURN check
            if (base_1.hex.encode(output.script).startsWith("6a24aa21a9ed")) {
                // OP_RETURN + Witness Commitment Tag
                witnessMerkleRoot = base_1.hex.encode(output.script.slice(10, 74)); // Extract witness-merkle-root (32 bytes after tag)
            }
            const extractedData = base_1.hex.encode(output.script.slice(1)); // OP_RETURN data
            witnessReservedValue = ensure32Bytes(extractedData);
            break; // Stop after finding the first OP_RETURN
        }
    }
    return { witnessReservedValue, witnessMerkleRoot };
}
function ensure32Bytes(hexStr) {
    const clean = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
    if (clean.length < 64) {
        return clean.padEnd(64, "0"); // Pad if too short
    }
    return clean.slice(0, 64); // Trim if too long
}
function extractProofInfo(tx, clarityBitcoinContract) {
    let segwitData = {};
    try {
        const txs = tx.block.txs;
        const reversedTxIds = tx.block.reversedTxIds;
        const txIndex = txs.findIndex((t) => t === tx.txId);
        if (txIndex === -1)
            throw new Error("Transaction not found in block!");
        const wproof = generateMerkleProof(reversedTxIds[txIndex], reversedTxIds)?.map((o) => o.hash) || [];
        wproof.splice(0, 1);
        const cproof = generateMerkleProof(reversedTxIds[0], reversedTxIds)?.map((o) => o.hash) || [];
        cproof.splice(0, 1);
        const merkleRoot = generateMerkleRoot(reversedTxIds);
        const merkleRootLE = base_1.hex.encode(base_1.hex.decode(tx.block.merkle_root).reverse());
        if (merkleRootLE !== merkleRoot)
            throw new Error("extractProofInfo: merkleRoot: " + merkleRootLE);
        const maxDepth = Math.max(wproof.length, cproof.length);
        // Pad both proofs if needed
        // while (wproof.length < maxDepth) {
        // 	//wproof.push('0000000000000000000000000000000000000000000000000000000000000000'); // 32-byte zero hash
        // }
        // while (cproof.length < maxDepth) {
        // 	//cproof.push('0000000000000000000000000000000000000000000000000000000000000000'); // 32-byte zero hash
        // }
        segwitData = {
            contract: clarityBitcoinContract,
            txId: tx.txId,
            txId0Reversed: tx.block.reversedTxIds[0],
            txIdReversed: tx.block.reversedTxIds[txIndex],
            height: Number(tx.block.height),
            txHex: tx.hex,
            wtxHex: tx.whex,
            header: tx.block.header,
            txIndex: txIndex,
            treeDepth: maxDepth,
            wproof: wproof,
            merkleRoot: merkleRoot,
            witnessReservedValue: tx.witnessReservedValue,
            witnessMerkleRoot: tx.witnessMerkleRoot,
            wctxHex: tx.cwhex,
            ctxHex: tx.chex,
            cproof: cproof,
        };
        console.log("Test data generated successfully:", segwitData);
    }
    catch (error) {
        console.error("Error generating test data:", error);
    }
    return segwitData;
}
//# sourceMappingURL=proof.js.map