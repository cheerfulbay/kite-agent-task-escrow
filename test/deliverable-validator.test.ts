import { describe, it, expect } from 'vitest';
import { DeliverableDigestValidator, DeliverableArtifact } from '../src/deliverable-validator.js';

describe('DeliverableDigestValidator', () => {
  const fileA: DeliverableArtifact = {
    fileName: 'audit_report.json',
    mimeType: 'application/json',
    byteLength: 2048,
    contentDigest: '0x1111111111111111111111111111111111111111111111111111111111111111',
  };

  const fileB: DeliverableArtifact = {
    fileName: 'patch.sol',
    mimeType: 'text/plain',
    byteLength: 512,
    contentDigest: '0x2222222222222222222222222222222222222222222222222222222222222222',
  };

  it('computes empty composite digest as zero hash', () => {
    expect(DeliverableDigestValidator.computeCompositeDigest([])).toBe('0x' + '0'.repeat(64));
  });

  it('computes deterministic digest and verifies match', () => {
    const digest = DeliverableDigestValidator.computeCompositeDigest([fileA, fileB]);
    expect(digest.startsWith('0x')).toBe(true);
    expect(DeliverableDigestValidator.verifyMatch([fileA, fileB], digest)).toBe(true);

    const tampered = [{ ...fileA, byteLength: 2049 }, fileB];
    expect(DeliverableDigestValidator.verifyMatch(tampered, digest)).toBe(false);
  });
});
