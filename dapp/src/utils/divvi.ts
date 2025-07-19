import { getReferralTag, submitReferral } from '@divvi/referral-sdk';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

// Export a function to get the referral tag for a user
export function getDivviReferralTag(user: `0x${string}`) {
  return getReferralTag({ user, consumer: '0x22886C71a4C1Fa2824BD86210ead1C310B3d7cf5' });
}

// Patch calldata with referral tag (append as hex string)
export function appendReferralTagToCalldata(calldata: string, referralTag: string) {
  // Both should be hex strings (0x...)
  return calldata + referralTag.replace(/^0x/, '');
}

// Report the transaction to Divvi
export async function reportDivviReferral(txHash: `0x${string}`, chainId: number) {
  await submitReferral({ txHash, chainId });
}

// Optionally, export a wallet client for direct usage (if needed elsewhere)
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum as any),
});

// Example usage (not to be used directly, just for reference):
// const tag = getDivviReferralTag(account, '0x123');
// const patchedData = appendReferralTagToCalldata(data, tag);
// await reportDivviReferral(txHash, chainId);
