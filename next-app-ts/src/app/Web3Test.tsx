"use client"
import WalletTest from "./WalletTest";
import SCInteraction from "./SCTest";
import GenerateWallet from "./GenerateWallet";

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
  const [length, setLength] = useState<number>(0);

  const init = async () => {
    const baseAccount = await WalletClient.getAccountFromSecretKey(secretKey);

    const testnetClient: Client = await ClientFactory.createDefaultClient(
      DefaultProviderUrls.TESTNET,
      true,
      baseAccount
    );
    setDeployer(testnetClient.wallet().getBaseAccount());
    const addressObj = testnetClient.wallet().getBaseAccount();
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
          <p>length address: {deployer.address?.length}</p>
          <p>length public key: {deployer.publicKey?.length}</p>
          <p>length private key: {deployer.secretKey?.length}</p>
          <p>Creathed in thread: {deployer.createdInThread} </p>


          <h2 style={{ marginTop: "50px" }}>Wallet Test</h2>
          <WalletTest deployerPrivateKey= {deployer.secretKey} />

          <h2 style={{ marginTop: "50px" }}>Smart Contract Interaction Test</h2>
          <SCInteraction deployerPrivateKey= {deployer.secretKey} />

          <h2 style={{ marginTop: "50px" }}>Generate Wallet Test</h2>
          <GenerateWallet deployerPrivateKey= {deployer.secretKey} />
        </div>
      )}
    </div>
  );
}
