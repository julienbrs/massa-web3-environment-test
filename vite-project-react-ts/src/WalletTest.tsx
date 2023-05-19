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
export default function WalletTest({ deployerPrivateKey }: any) {
  const receiverPrivateKey =
    "S1ykLaxXyMnJoaWLYds8UntqKTamZ4vcxrZ1fdToR8WpWEpk3FC";

  const init = async () => {
    try {
      console.log("Deployer Wallet ", deployerPrivateKey);
      // init account
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

      // get wallet balance
      const deployerAccountBalance = await web3Client
        .wallet()
        .getAccountBalance(deployerAccount.address as string);
      console.log(
        `Deployer Wallet Address: ${
          deployerAccount.address
        } with balance (candidate, final) = (${deployerAccountBalance?.candidate.toString()}, ${deployerAccountBalance?.final.toString()})`
      );

      // get wallet accounts
      let walletAccounts = await web3Client.wallet().getWalletAccounts();
      console.log("Wallet Accounts ", walletAccounts);

      // get wallet info
      const walletInfo = await web3Client.wallet().walletInfo();
      console.log("Wallet Info ", walletInfo);

      // add a new wallet
      console.log("Adding a new Account ...");
      await web3Client.wallet().addSecretKeysToWallet([receiverPrivateKey]);

      // get wallet accounts
      walletAccounts = await web3Client.wallet().getWalletAccounts();
      console.log("Wallet Accounts (UPDATED) ", walletAccounts);

      // get the second account (the receiver)
      const senderAccount = walletAccounts[0];
      const receiverAccount = walletAccounts[1];

      // get receiver's wallet balance
      const receiverAccountBalanceBefore = await web3Client
        .wallet()
        .getAccountBalance(receiverAccount.address as string);
      console.log(
        `Receiver Wallet Balance (Before): ${
          receiverAccount.address
        } with balance (candidate, final) = (${receiverAccountBalanceBefore?.candidate.toString()}, ${receiverAccountBalanceBefore?.final.toString()})`
      );

      // sign a random wallet message using account2
      const signedMessage = await web3Client
        .wallet()
        .signMessage("hello there", receiverAccount.address as string);
      console.log("Wallet sender signing a message... ", signedMessage);

      // verify a signature
      const signature: ISignature = {
        base58Encoded:
          "B1Gy7pAstdqzjghn8fdLDtn1qLUhsxWu4x1j8N4W9wxa3hTPNsFyPeFkSkfEjVCRnCAE9jrBjernGyoDL1yt2Wgafb8uu",
      };

      const message = "hello world";

      const isVerified = await web3Client
        .wallet()
        .verifySignature(
          message,
          signature,
          "P1c6udwDMs6CY2YDUm7phdrv6S5ACjTV5jW4Kriio44yDpRWK8t"
        );
      console.log("Signature verification: ", isVerified);

      // send from base account to receiver
      const txId = await web3Client.wallet().sendTransaction({
        amount: fromMAS(1),
        fee: 0n,
        recipientAddress: receiverAccount.address as string,
      } as ITransactionData);
      console.log("Money Transfer:: TxId ", txId[0]);

      // await finalization
      console.log("Awaiting Finalization ...");
      await web3Client
        .smartContracts()
        .awaitRequiredOperationStatus(txId[0], EOperationStatus.FINAL);

      console.log("Polling events ... ");
      const events = await EventPoller.getEventsOnce(
        {
          start: null,
          end: null,
          original_operation_id: txId[0],
          original_caller_address: null,
          emitter_address: null,
        } as IEventFilter,
        web3Client
      );
      console.log("Polled Events ", events);

      // get receiver's wallet after
      const receiverAccountBalanceAfter = await web3Client
        .wallet()
        .getAccountBalance(receiverAccount.address as string);
      console.log(
        `Receiver Wallet Balance (After): ${
          receiverAccount.address
        } with balance (candidate, final) = (${receiverAccountBalanceAfter?.candidate.toString()}, ${receiverAccountBalanceAfter?.final.toString()})`
      );

      // get sender's wallet after
      const senderAccountBalanceAfter = await web3Client
        .wallet()
        .getAccountBalance(senderAccount.address as string);
      console.log(
        `Sender Wallet Balance (After): ${
          receiverAccount.address
        } with balance (candidate, final) = (${senderAccountBalanceAfter?.candidate.toString()}, ${senderAccountBalanceAfter?.final.toString()})`
      );

      // sender buys some rolls
      const buyRollsTxId = await web3Client.wallet().buyRolls({
        amount: 2n,
        fee: fromMAS(0),
      } as IRollsData);
      console.log("Buy Rolls Tx Id ", buyRollsTxId);
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <div>
      <button onClick={init}>Launch test</button>
    </div>
  );
}
