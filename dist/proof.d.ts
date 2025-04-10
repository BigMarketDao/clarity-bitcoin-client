import { ProofGenerationData, ProofRequest, TransactionProofSet } from "./proof-types.js";
export declare function extractProofInfo(pgd: ProofGenerationData, data: ProofRequest): TransactionProofSet;
/**
 * If the hashes length is not even, then it copies the last hash and adds it to the
 * end of the array, so it can be hashed with itself.
 * @param {Array<string>} hashes
 */
export declare function ensureEven(hashes: Array<string>): void;
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
export declare function generateMerkleTree(hashes: Array<string>): string[][];
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
export declare function generateMerkleProof(hash: string, hashes: Array<string>): {
    merkleProof: string[];
    treeDepth: number;
};
//# sourceMappingURL=proof.d.ts.map