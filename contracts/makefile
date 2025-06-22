include .env
export

CELO_ALFAJORES_ARGS := --rpc-url "https://celo-alfajores.drpc.org" --account defaultKey --broadcast --verify --verifier-url 'https://api-alfajores.celoscan.io/api' --etherscan-api-key ${CELO_API_KEY} -vvvv
BASE_SEPOLIA_ARGS := --rpc-url "https://base-sepolia.drpc.org" --account defaultKey --broadcast --verify --verifier-url 'https://api.etherscan.io/v2/api' --etherscan-api-key ${ETHERSCAN_API_KEY} -vvvv

deployStatic: 
	@forge clean
	@echo "Deploying SplitterStaticFactory to mantle testnet"
	@forge script script/SplitterStaticFactory.s.sol:SplitterStaticFactoryScript $(MANTLE_SEPOLIA_ARGS)

deployCCOPMock:
	@forge clean
	@echo "Deploying CCOPMock to Celo Alfajores testnet"
	@forge script script/CCOPMock.s.sol:CCOPMockScript $(CELO_ALFAJORES_ARGS)
