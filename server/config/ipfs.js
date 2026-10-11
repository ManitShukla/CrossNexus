const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Base58btc character alphabet (Bitcoin & IPFS standard)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Encodes a buffer into Base58btc string
 */
function toBase58(buffer) {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += buffer[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) digits.push(0);
  return digits.reverse().map(d => ALPHABET[d]).join('');
}

/**
 * Generate a mathematically valid IPFS CIDv0 (Qm... multihash) from buffer
 * Prefix 0x12 = sha256 function code; 0x20 = 32 bytes length
 */
function computeDeterministicIpfsCid(buffer) {
  const sha256Digest = crypto.createHash('sha256').update(buffer).digest();
  const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), sha256Digest]);
  return toBase58(multihash);
}

/**
 * Pin file buffer to IPFS via Pinata cloud or autonomous fallback generator
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {object} metadata
 */
async function pinFileToIPFS(fileBuffer, originalName, metadata = {}) {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
  const pinataJwt = process.env.PINATA_JWT;

  // Check if live Pinata credentials exist
  if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
    try {
      console.log(`[IPFS_UPLINK] Pinning '${originalName}' to Pinata cloud gateway...`);
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, originalName);

      const pinataMetadata = JSON.stringify({
        name: `NSUT_VAULT_${metadata.courseCode || 'RESOURCE'}_${originalName}`,
        keyvalues: {
          courseCode: metadata.courseCode || 'UNKNOWN',
          type: metadata.type || 'DOCUMENT',
          platform: 'CROSSNEXUS',
        },
      });
      formData.append('pinataMetadata', pinataMetadata);

      const headers = {};
      if (pinataJwt) {
        headers['Authorization'] = `Bearer ${pinataJwt}`;
      } else {
        headers['pinata_api_key'] = pinataApiKey;
        headers['pinata_secret_api_key'] = pinataSecretKey;
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata API returned HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`\x1b[32m%s\x1b[0m`, `[IPFS_PINNED] Content Identifier: ${result.IpfsHash} | Pin Size: ${result.PinSize} bytes`);

      return {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp || new Date().toISOString(),
        isMock: false,
      };
    } catch (pinataErr) {
      console.warn(`[IPFS_PINATA_WARN] Remote Pinata call failed (${pinataErr.message}). Engaging fallback generator.`);
    }
  }

  // ---------------------------------------------------------------------------
  // AUTONOMOUS RESILIENT FALLBACK: Compute deterministic IPFS CIDv0
  // ---------------------------------------------------------------------------
  const deterministicCid = computeDeterministicIpfsCid(fileBuffer);
  console.log(`[IPFS_OFFLINE_STUB] Generated deterministic CIDv0: ${deterministicCid} (${fileBuffer.length} bytes)`);

  // Optionally cache to local disk vault for offline download retrieval
  const vaultStorageDir = path.join(__dirname, '..', 'uploads', 'vault');
  try {
    if (!fs.existsSync(vaultStorageDir)) {
      fs.mkdirSync(vaultStorageDir, { recursive: true });
    }
    const targetFile = path.join(vaultStorageDir, `${deterministicCid}-${originalName}`);
    fs.writeFileSync(targetFile, fileBuffer);
  } catch (diskErr) {
    console.warn('[IPFS_DISK_CACHE_WARN]', diskErr.message);
  }

  return {
    ipfsHash: deterministicCid,
    pinSize: fileBuffer.length,
    timestamp: new Date().toISOString(),
    isMock: true,
  };
}

module.exports = {
  pinFileToIPFS,
  computeDeterministicIpfsCid,
};
