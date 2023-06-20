import { useState } from "react";
// import MassaWeb3Test from './Web3Test'
import "./App.css";
import {
  ClientFactory,
  IAccount,
  WalletClient,
  Client,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

function App() {
  async function init() {
    const receiverPrivateKey =
      "S15FC5iqVhagLytnKZXyeR6qRQv5qCnf2MZRau9fMW7Ht8MfTry";
    const deployerAccount: IAccount =
      await WalletClient.getAccountFromSecretKey(receiverPrivateKey);
    console.log("Deployer Wallet ", deployerAccount);
  }

  return (
    <>
      <div>
        <h1>Test Massa Web3</h1>
        <button onClick={init}>Init</button>
      </div>
    </>
  );
}

export default App;
