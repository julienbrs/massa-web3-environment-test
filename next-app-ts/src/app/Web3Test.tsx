"use client"
import WalletTest from "./WalletTest";
import SCInteraction from "./SCTest";

import { useEffect, useState } from "react";
import {
  ClientFactory,
  IAccount,
  WalletClient,
  Client,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

const secretKey = "S12XuWmm5jULpJGXBnkeBsuiNmsGi2F4rMiTvriCzENxBR4Ev7vd"

export default function MassaWeb3Test() {
  const [deployer, setDeployer] = useState<IAccount | null>(null);

  const init = async () => {
    const baseAccount = await WalletClient.getAccountFromSecretKey(secretKey);

    const testnetClient: Client = await ClientFactory.createDefaultClient(
      DefaultProviderUrls.TESTNET,
      true,
      baseAccount
    );
    setDeployer(testnetClient.wallet().getBaseAccount());
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>Test Massa Web3</h1>
      {deployer && (
        <div>
          <h2>Deployer informations</h2>
          <p>Deployer Address: {deployer.address}</p>
          <p>Deployer Public Key: {deployer.publicKey}</p>
          <p>Deployer Private Key: {deployer.secretKey}</p>

          <h2 style={{ marginTop: "50px" }}>Wallet Test</h2>
          <WalletTest deployerPrivateKey= {deployer.secretKey} />

          <h2 style={{ marginTop: "50px" }}>Smart Contract Interaction Test</h2>
          <SCInteraction deployerPrivateKey= {deployer.secretKey} />
        </div>
      )}
    </div>
  );
}
