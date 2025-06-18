export const CCIPWrapperABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "selector",
        type: "address"
      },
      {
        internalType: "address",
        name: "vault",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "burnAndRedeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const; 