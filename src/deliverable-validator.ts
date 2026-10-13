import { type Hex, hexToBytes, toHex, encodePacked, keccak256 } from 'viem';

export interface DeliverableArtifact {
  fileName: string;
  mimeType: string;
  byteLength: number;
  contentDigest: Hex;
}

/**
 * DeliverableDigestValidator
 * Calculates and anchors deterministic composite cryptographic fingerprints for complex agent artifacts
 */
export class DeliverableDigestValidator {
  public static computeCompositeDigest(artifacts: DeliverableArtifact[]): Hex {
    if (artifacts.length === 0) {
      return ('0x' + '0'.repeat(64)) as Hex;
    }

    // Hash each artifact deterministically using keccak256
    const artifactHashes: Hex[] = artifacts.map((a) =>
      keccak256(
        encodePacked(
          ['string', 'string', 'uint256', 'bytes32'],
          [a.fileName, a.mimeType, BigInt(a.byteLength), a.contentDigest]
        )
      )
    );

    // Combine individual hashes into root composite hash
    let rolling = artifactHashes[0];
    for (let i = 1; i < artifactHashes.length; i++) {
      rolling = keccak256(encodePacked(['bytes32', 'bytes32'], [rolling, artifactHashes[i]]));
    }

    return rolling;
  }

  public static verifyMatch(artifacts: DeliverableArtifact[], expectedDigest: Hex): boolean {
    const actual = this.computeCompositeDigest(artifacts);
    return actual.toLowerCase() === expectedDigest.toLowerCase();
  }
}
