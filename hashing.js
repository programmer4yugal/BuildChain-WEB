// Helper function to sort object keys recursively for deterministic JSON
function sortKeys(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
    }, {});
}

// Utility to generate SHA-256 hash with Chaining
async function generateHash(data, previousHash = "0x0000000000000000000000000000000000000000", timestamp = null) {
    // Create a block structure mimicking a real blockchain
    const blockData = {
        data: data,
        previousHash: previousHash,
        timestamp: timestamp || new Date().toISOString()
    };

    const jsonString = JSON.stringify(sortKeys(blockData));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    // Use Web Crypto API for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return '0x' + hashHex;
}
