include .env
export

CELO_ALFAJORES_ARGS := --rpc-url $(RPC_URL_CELO_ALFAJORES) \
                        --account defaultKey \
                        --broadcast \
                        --verify \
                        --etherscan-api-key $(ETHERSCAN_API) \

BASE_SEPOLIA_ARGS := --rpc-url $(RPC_URL_BASE_SEPOLIA) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

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

unitTest:
	@forge test --match-path "test/$(type)/$(subType)/$(contract).t.sol"

