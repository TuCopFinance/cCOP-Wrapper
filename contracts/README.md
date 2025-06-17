# Smart Contracts – Wrapped cCOP Bridge

Este paquete contiene los contratos de Solidity para implementar:

- ✅ Vault de cCOP en Celo (respaldo 1:1)
- ✅ Wrapped cCOP (wCOP) en Base
- 🔄 Conexión vía Chainlink CCIP

## 🛠️ Requisitos

- Node.js >= 18
- Hardhat
- Celo y Base RPCs

## 🚀 Comandos útiles

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network celo
```

## 🔐 Variables de entorno

Crea un archivo `.env`:

```
PRIVATE_KEY=tu_clave_privada
```

## 📁 Estructura

- `/contracts/` – código fuente
- `/scripts/` – scripts de despliegue
