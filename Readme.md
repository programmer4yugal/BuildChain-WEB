# BuildChain Transparency DApp

## Setup
1. Install MetaMask and switch to Sepolia testnet.
2. Fund accounts with faucet ETH.
3. Deploy `contracts/BuildChain.sol` via Remix.
4. Copy ABI JSON into `abi/BuildChain.json`.
5. Update `app.js` with your contract address.
6. Open `index.html` in browser.

## Workflow
- Admin creates projects and assigns Contractor.
- Contractor submits milestones.
- Labor Manager marks attendance.
- All actions are signed by MetaMask and visible on Sepolia Etherscan.