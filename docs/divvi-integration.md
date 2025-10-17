# Divvi Integration

This dapp has been integrated with the Divvi referral system to track and attribute user actions across the ecosystem.

## Consumer Address

The dapp is registered with Divvi using the consumer address:
```
0x22886C71a4C1Fa2824BD86210ead1C310B3d7cf5
```

## How it Works

The integration works by:

1. **Generating Referral Tags**: For each transaction, a referral tag is generated that includes:
   - The user's wallet address (who consented to the transaction)
   - The consumer address (this dapp's identifier)

2. **Adding Tags to Transactions**: The referral tag is appended to transaction calldata using the `dataSuffix` parameter in Wagmi/Viem contracts

3. **Reporting to Divvi**: After successful transactions, the transaction hash and chain ID are submitted to Divvi's attribution tracking API

## Integrated Functions

The following functions now include Divvi referral tracking:

### WrapperComponent
- `setAllowance()` - When approving cCOP tokens for wrapping
- `wrap()` - When wrapping cCOP tokens to wcCOP on destination chains

### UnwrapperComponent  
- `unwrap()` - When unwrapping wcCOP tokens back to cCOP

## Supported Networks

Divvi referral tracking is active on all supported networks:
- **Celo** (Chain ID: 42220) - For cCOP token operations
- **Base** (Chain ID: 8453) - For wcCOP operations  
- **Arbitrum** (Chain ID: 42161) - For wcCOP operations

## Error Handling

The integration is designed to be non-intrusive:
- If Divvi referral submission fails, it logs a warning but doesn't affect the main transaction
- Users will still be able to wrap/unwrap tokens even if Divvi services are temporarily unavailable

## Technical Implementation

The integration uses the `@divvi/referral-sdk` v2.2.0 with:
- `getReferralTag()` to generate referral metadata
- `submitReferral()` to report transactions to the attribution API

Key implementation details:
- Referral tags are added via `dataSuffix` parameter (recommended method)
- User consent is cryptographically verified by checking transaction senders
- Referral submission happens asynchronously after successful transactions

## Privacy

The integration only tracks on-chain transaction data that's already publicly available. No additional personal information is collected or transmitted to Divvi beyond what's included in the blockchain transactions themselves.
