import { getReferralTag, submitReferral } from "@divvi/referral-sdk";

// Divvi consumer address for your dapp
export const DIVVI_CONSUMER_ADDRESS = "0x22886C71a4C1Fa2824BD86210ead1C310B3d7cf5";

/**
 * Generate a referral tag for a user transaction
 * @param userAddress - The address of the user making the transaction
 * @returns The referral tag to include in transaction calldata
 */
export const generateReferralTag = (userAddress: `0x${string}`): string => {
  return getReferralTag({
    user: userAddress,
    consumer: DIVVI_CONSUMER_ADDRESS,
  });
};

/**
 * Submit a referral to Divvi's tracking system
 * @param txHash - The transaction hash
 * @param chainId - The chain ID where the transaction was executed
 */
export const submitDivviReferral = async (
  txHash: `0x${string}`,
  chainId: number
): Promise<void> => {
  try {
    await submitReferral({
      txHash,
      chainId,
    });
    console.log("Divvi referral submitted successfully:", txHash);
  } catch (error) {
    console.warn("Failed to submit Divvi referral:", error);
    // Don't throw - we don't want referral issues to affect the main transaction flow
  }
};
