/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Image from "next/image";
import styles from "./SelfGasFeeSponsorshipComponent.module.css";
import { SelfApp, SelfAppBuilder, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { config } from "@/config";
import { getAccount, readContracts } from "@wagmi/core";
import toast from "react-hot-toast";
import { address } from "@/constants/address";
import GasFeeSponsorship from "@/constants/abis/GasFeeSponsorship.json";
import { chainID } from "@/constants/chainID";

const GasFeeSponsorshipContract = {
  address: address.mainnet.GasFeeSponsorship as `0x${string}`,
  abi: GasFeeSponsorship.abi as any,
  chainId: chainID.mainnet.celo,
} as const;

export const SelfGasFeeSponsorshipComponent = ({
  quote,
}: {
  quote: bigint;
}) => {
  const [selfApp, setSelfApp] = React.useState<SelfApp | null>(null);
  const [showButton, setShowButton] = React.useState(false);
  const [showDoneVerification, setShowDoneVerification] = React.useState(false);

  const verifyUserSponsorship = async () => {
    const account = getAccount(config);
    if (!account.address) {
      console.error("No account address found");
      return null;
    }
    try {
      const [userInfo, amountOnContract] = await readContracts(config, {
        contracts: [
          {
            ...GasFeeSponsorshipContract,
            functionName: "getUserInfo",
            args: [account.address as `0x${string}`],
          },
          {
            ...GasFeeSponsorshipContract,
            functionName: "getAmountOnContract",
            args: [],
          },
        ],
      });

      return {
        timesToSponsor: (userInfo.result as any).timesToSponsor,
        timeStamp: (userInfo.result as any).timeStamp,
        amountOnContract: amountOnContract.result as bigint,
      };
    } catch (error) {
      console.error("Error reading contracts:", error);
      return null;
    }
  };

  const verifyUser = async () => {
    console.log("Verifying user for gas fee sponsorship...");
    const account = getAccount(config);
    const selfApp = new SelfAppBuilder({
      // Contract integration settings
      endpoint: "0xD4C37ed2C0A4de515382d2EEa0940ea99234Ca72", // Your SelfVerificationRoot contract
      endpointType: "celo", // "staging_celo" or "celo"
      version: 2, // Always use V2 for contracts

      // Your app details
      appName: "wrap cCOP",
      scope: "gas-fee-wrap-ccop", // Max 30 characters
      userIdType: "hex",
      userId: account.address as `0x${string}`, // User's wallet address
      // Verification configuration (must match your contract)
      disclosures: { ofac: true },
      userDefinedData: quote.toString(), // Example user-defined data, can be any value
    }).build();
    setSelfApp(selfApp);
  };

  //ejecutar verifyUserSponsorship en el primer render o cada vez que cambien el quote
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await verifyUserSponsorship();
      console.log("Data fetched1111:", data);
      if (data) {
        if (BigInt(data.amountOnContract) < BigInt(quote)) {
          setShowButton(false);
          console.error("Insufficient amount on contract for sponsorship");
        } else {
          ///convierte la fecha de hoy en unix timestamp
          const today = new Date();
          const unixTimestamp = Math.floor(today.getTime() / 1000);
          console.log("Current Unix Timestamp:", unixTimestamp);
          const sevenDaysInSeconds =
            BigInt(7) * BigInt(24) * BigInt(60) * BigInt(60);
          const timestampPassSevenDays = data.timeStamp + sevenDaysInSeconds;
          console.log("timestampPassSevenDays:", timestampPassSevenDays);
          console.log("flag");
          if (timestampPassSevenDays < unixTimestamp) {
            console.log("flag 0");
            console.log("data.timeStamp:", data.timeStamp);
            console.log("unixTimestamp:", unixTimestamp);
            setShowButton(true);
          } else {
            console.log("flag 1");
            if (BigInt(data.timesToSponsor) !== BigInt(3)) {
              console.log("flag 2");
              setShowButton(true);
            } else {
              console.log("flag 3");
              setShowButton(false);
              console.error(
                "You have reached the maximum number of sponsorships for this week."
              );
            }
          }
        }
        
      } else {
        setShowButton(false);
        console.error("Failed to fetch user sponsorship data");
      }
    };
    fetchData();
  }, [quote]);

  return (
    <div
      style={{
        marginTop: "20px",
        flex: 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      {selfApp ? (
        <div
          style={{
            //permitir en columnas
            width: "100%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p>
            Por favor escanea el código QR con la app de self para validar tu
            humanidad
          </p>

          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={() => {
              console.log("Verification successful");
              toast.success("Successfully claimed!", {
                position: "bottom-right",
                style: {
                  background: "#707070",
                  color: "#fff",
                  minWidth: "300px",
                  position: "relative",
                },
              });
              setSelfApp(null);
              setShowButton(false);
              setShowDoneVerification(true);
            }}
            onError={() => {
              console.error("Verification failed");
              toast.error("Claim failed", {
                position: "bottom-right",
                style: {
                  background: "#707070",
                  color: "#fff",
                  minWidth: "300px",
                  position: "relative",
                },
              });
              setSelfApp(null);
              setShowButton(true);
              setShowDoneVerification(false);
            }}
          />

          <button
            onClick={() => {
              setSelfApp(null);
            }}
            className={styles.selfButton}
            style={{ marginTop: "20px" }}
          >
            <span>Cerrar</span>
          </button>
        </div>
      ) : showButton ? (
        <button onClick={verifyUser} className={styles.selfButton}>
          <Image
            src="/assets/SelfLogo.svg"
            alt="Arbitrum"
            width={24}
            height={24}
          />
          <span>{`Apadrinar wrapping`}</span>
        </button>
      ) : (
        showDoneVerification && (
          <div
            style={{
              //permitir en columnas
              width: "100%",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p>
              Has verificado tu humanidad, se te ha depositado{" "}
              {(Number(quote) / 1e18).toFixed(6)} CELO en tu cuenta
            </p>
            <button
              onClick={() => {
                setShowDoneVerification(false);
              }}
              className={styles.selfButton}
              style={{ marginTop: "20px" }}
            >
              <span>Cerrar</span>
            </button>
          </div>
        )
      )}
    </div>
  );
};
