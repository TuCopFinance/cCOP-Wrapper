include .env
export

CELO_ALFAJORES_ARGS := --rpc-url "https://celo-alfajores.drpc.org" --account defaultKey --broadcast --verify --verifier-url 'https://api-alfajores.celoscan.io/api' --etherscan-api-key ${CELO_API_KEY} -vvvv
BASE_SEPOLIA_ARGS := --rpc-url "https://base-sepolia.drpc.org" --account defaultKey --broadcast --verify --verifier-url 'https://api.etherscan.io/v2/api?chainid=84532' --etherscan-api-key ${ETHERSCAN_API_KEY} -vvvv

deployCCOPMock:
	@forge clean
	@echo "Deploying CCOPMock to Celo Alfajores testnet"
	@forge script script/CCOPMock.s.sol:CCOPMockScript $(CELO_ALFAJORES_ARGS)

deployTreasury:
	@forge clean
	@echo "Deploying Treasury to Celo Alfajores testnet"
	@forge script script/Treasury.s.sol:TreasuryScript $(CELO_ALFAJORES_ARGS)

deployWrappedCCOP:
	@forge clean
	@echo "Deploying WrappedCCOP to Base Sepolia testnet"
	@forge script script/WrappedCCOP.s.sol:WrappedCCOPScript $(BASE_SEPOLIA_ARGS)
