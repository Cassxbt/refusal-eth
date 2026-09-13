# Privy wallet and Sepolia funding evidence

Status: verified on 2026-09-13.

The Privy dashboard and authenticated API identify the same wallet:

- Display name: `dddddd` (author-selected)
- Wallet ID: `rj1ylgxoebssw47tl21qu1p1`
- Address: `0x3Afbd80558dE2CDBbb6643417696D0A0B83Dff7d`
- Chain type: Ethereum-compatible EVM
- Owner quorum: `REFUSAL Server Gate`
- Owner quorum ID: `turrw47vgdxjyh599p2xe1y1`
- Authorization threshold: 1 of 1
- Policy: `REFUSAL Sepolia USDC Gate`
- Policy ID: `bmi0bnmdxxspf4yllnpmxtxz`

The policy contains an `eth_sendTransaction` ALLOW rule constrained to Sepolia
chain ID `11155111` and the Sepolia USDC contract
`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`.

## Sepolia funding receipt

A disposable Sepolia source wallet transferred `0.01 ETH` to the Privy wallet.
The transfer was estimated, submitted, and confirmed with the project funding
helper:

- Chain ID: `11155111`
- Source: `0xe8CC1A5d28719637bE8066A01021650b5eE239FE`
- Destination: `0x3Afbd80558dE2CDBbb6643417696D0A0B83Dff7d`
- Transaction: [`0x87bec141616de2345641f7668f1459368d8c64481c68f9185b946d6d68d38ef2`](https://sepolia.etherscan.io/tx/0x87bec141616de2345641f7668f1459368d8c64481c68f9185b946d6d68d38ef2)
- Block: `11696941`
- Receipt status: `success`

This proves wallet creation, policy/quorum binding, and funded Sepolia
infrastructure. It does not claim a signed Privy USDC transaction; that remains
separate evidence.
