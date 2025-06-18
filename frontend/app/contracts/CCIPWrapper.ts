import { WalletClient, PublicClient, Hash, Address } from 'viem';
import { CCIPWrapperABI } from './abis/CCIPWrapper';

export class CCIPWrapper {
  private address: Address;
  private walletClient: WalletClient;
  private publicClient: PublicClient;

  constructor(
    address: Address,
    walletClient: WalletClient,
    publicClient: PublicClient
  ) {
    this.address = address;
    this.walletClient = walletClient;
    this.publicClient = publicClient;
  }

  async burnAndRedeem(
    selector: string,
    vault: string,
    amount: bigint
  ): Promise<{ hash: Hash; wait: () => Promise<{ transactionHash: Hash }> }> {
    const { request } = await this.publicClient.simulateContract({
      address: this.address,
      abi: CCIPWrapperABI,
      functionName: 'burnAndRedeem',
      args: [selector as Address, vault as Address, amount],
      account: this.walletClient.account,
    });

    const hash = await this.walletClient.writeContract({
      ...request,
      account: this.walletClient.account,
    });
    
    return {
      hash,
      wait: async () => {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        return { transactionHash: receipt.transactionHash };
      },
    };
  }
} 