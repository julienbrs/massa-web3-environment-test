import React, { useEffect } from "react";
import {
  IAccount,
  ClientFactory,
  WalletClient,
  EOperationStatus,
  ITransactionData,
  ProviderType,
  fromMAS,
  ISignature,
  Client,
  IProvider,
  EventPoller,
  IEventFilter,
  IRollsData,
} from "@massalabs/massa-web3";

// const publicApi = "https://test.massa.net/api/v2";
const publicApi = "http://127.0.0.1:33035/";
// const privateApi = "https://test.massa.net/api/v2";
const privateApi = "http://127.0.0.1:330342";

// prend en props le deployerPrivateKey
export default function GenerateWallet({ deployerPrivateKey }: any) {
  const init = async () => {
    try {
      const deployerAccount: IAccount =
        await WalletClient.getAccountFromSecretKey(deployerPrivateKey);

      console.log("Deployer Wallet ", deployerAccount);

      // init web3 client with base account
      const web3Client: Client = await ClientFactory.createCustomClient(
        [
          { url: publicApi, type: ProviderType.PUBLIC } as IProvider,
          { url: privateApi, type: ProviderType.PRIVATE } as IProvider,
        ],
        true,
        deployerAccount
      );
      // get wallet accounts
      let walletAccounts = await web3Client.wallet().getWalletAccounts();
      console.log("Wallet Accounts before", walletAccounts);

      // create new account
      const newAccount: IAccount =
        await WalletClient.walletGenerateNewAccount();
      console.log("New Account ", newAccount);

      // add new account to wallet
      await web3Client
        .wallet()
        .addSecretKeysToWallet([newAccount.secretKey as string]);
      walletAccounts = await web3Client.wallet().getWalletAccounts();
      console.log("Wallet Accounts after", walletAccounts);

      // Send 1.5 MAS to new account
      const txId = await web3Client.wallet().sendTransaction({
        amount: fromMAS(1),
        fee: 0n,
        recipientAddress: newAccount.address as string,
      } as ITransactionData);
      console.log("Money Transfer:: TxId ", txId[0]);

      // await finalization
      console.log("Awaiting Finalization ...");
      await web3Client
        .smartContracts()
        .awaitRequiredOperationStatus(txId[0], EOperationStatus.FINAL);

      // get wallet balance
      const newAccountBalance = await web3Client

        .wallet()
        .getAccountBalance(newAccount.address as string);
      console.log(
        `New Account Address: ${
          newAccount.address
        } with balance (candidate, final) = (${newAccountBalance?.candidate.toString()}, ${newAccountBalance?.final.toString()})`
      );
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <div>
      <button onClick={init}>Generate Account</button>
    </div>
  );
}
