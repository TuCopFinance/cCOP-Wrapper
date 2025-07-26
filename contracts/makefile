include .env
export

CELO_ALFAJORES_ARGS := --rpc-url $(RPC_URL_CELO_ALFAJORES) \
                        --account defaultKey \
                        --broadcast \
                        --verify \
                        --etherscan-api-key $(ETHERSCAN_API) \

CELO_MAINNET_ARGS := --rpc-url $(RPC_URL_CELO_MAINNET) \
                        --account defaultKey \
                        --broadcast \
                        --verify \
                        --etherscan-api-key $(ETHERSCAN_API) \

BASE_SEPOLIA_ARGS := --rpc-url $(RPC_URL_BASE_SEPOLIA) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

BASE_MAINNET_ARGS := --rpc-url $(RPC_URL_BASE_MAINNET) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

ARB_SEPOLIA_ARGS := --rpc-url $(RPC_URL_ARB_TESTNET) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

ARB_MAINNET_ARGS := --rpc-url $(RPC_URL_ARB_MAINNET) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

deployCCOPMock:
	@forge clean
	@echo "Deploying CCOPMock to Celo Alfajores testnet"
	@forge script script/CCOPMock.s.sol:CCOPMockScript $(CELO_ALFAJORES_ARGS)

deployTreasury_TEST:
	@forge clean
	@echo "Deploying Treasury to Celo Alfajores testnet"
	@forge script script/Treasury.s.sol:TreasuryScript $(CELO_ALFAJORES_ARGS)

deployWrappedCCOP_BaseTest:
	@forge clean
	@echo "Deploying WrappedCCOP to Base Sepolia"
	@forge script script/WrappedCCOP_BASE.s.sol:WrappedCCOP_Base_Script $(BASE_SEPOLIA_ARGS)

deployWrappedCCOP_ArbTest:
	@forge clean
	@echo "Deploying WrappedCCOP to Arbitrum Sepolia"
	@forge script script/WrappedCCOP_ARB.s.sol:WrappedCCOP_ARB_Script $(ARB_SEPOLIA_ARGS)

deployTreasury:
	@forge clean
	@echo "Deploying Treasury to Celo Mainnet"
	@forge script script/Treasury.s.sol:TreasuryScript $(CELO_MAINNET_ARGS)

deployWrappedCCOP_Base:
	@forge clean
	@echo "Deploying WrappedCCOP to Base Mainnet"
	@forge script script/WrappedCCOP_BASE.s.sol:WrappedCCOP_Base_Script $(BASE_MAINNET_ARGS)

deployWrappedCCOP_Arb:
	@forge clean
	@echo "Deploying WrappedCCOP to Arbitrum Mainnet"
	@forge script script/WrappedCCOP_ARB.s.sol:WrappedCCOP_Arb_Script $(ARB_MAINNET_ARGS)

deployGasFeeSponsorship_TEST:
	@forge clean
	@echo "Deploying GasFeeSponsorship to Celo Alfajores testnet"
	@forge script script/GasFeeSponsorship.s.sol:GasFeeSponsorshipScript $(CELO_ALFAJORES_ARGS)

deployGasFeeSponsorship:
	@forge clean
	@echo "Deploying GasFeeSponsorship to Celo Mainnet"
	@forge script script/GasFeeSponsorship.s.sol:GasFeeSponsorshipScript $(CELO_MAINNET_ARGS)

unitTest:
	@forge test --match-path "test/unit/$(type)/$(contract).t.sol" -vvv --show-progress --summary --detailed

fuzzTest:
	@forge test --match-path "test/fuzz/$(contract).t.sol" -vvv --show-progress --summary --detailed

