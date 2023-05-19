<template>
  <div>
    <button @click="init">Launch test</button>
  </div>
</template>

<script>
import {
  ClientFactory,
  WalletClient,
  EOperationStatus,
  ProviderType,
  fromMAS,
  Client,
  EventPoller,
} from "@massalabs/massa-web3";

export default {
  name: "WalletTest",
  data() {
    return {
      deployerPrivateKey: "S12tw4YShWtjWfy7YBQ9Erbcg6DYgWnMgb5hGjn9hAKGtgrLNa7L",
      receiverPrivateKey: "S1ykLaxXyMnJoaWLYds8UntqKTamZ4vcxrZ1fdToR8WpWEpk3FC",
    };
  },
  methods: {
    async init() {
      try {
        console.log("Deployer Wallet ", this.deployerPrivateKey);
        // init account
        const deployerAccount = await WalletClient.getAccountFromSecretKey(this.deployerPrivateKey);

        console.log("Deployer Wallet ", deployerAccount);

        // init web3 client with base account
        const web3Client = await ClientFactory.createCustomClient(
          [
            { url: "http://127.0.0.1:33035/", type: ProviderType.PUBLIC },
            { url: "http://127.0.0.1:33034/", type: ProviderType.PRIVATE },
          ],
          true,
          deployerAccount
        );

        // get wallet balance
        const deployerAccountBalance = await web3Client.wallet().getAccountBalance(deployerAccount.address);
        console.log(`Deployer Wallet Address: ${deployerAccount.address} with balance (candidate, final) = (${deployerAccountBalance?.candidate.toString()}, ${deployerAccountBalance?.final.toString()})`);

        // get wallet accounts
        let walletAccounts = await web3Client.wallet().getWalletAccounts();
        console.log("Wallet Accounts ", walletAccounts);

        // get wallet info
        const walletInfo = await web3Client.wallet().walletInfo();
        console.log("Wallet Info ", walletInfo);

        // add a new wallet
        console.log("Adding a new Account ...");
        await web3Client.wallet().addSecretKeysToWallet([this.receiverPrivateKey]);

        // get wallet accounts
        walletAccounts = await web3Client.wallet().getWalletAccounts();
        console.log("Wallet Accounts (UPDATED) ", walletAccounts);

        // get the second account (the receiver)
        const senderAccount = walletAccounts[0];
        const receiverAccount = walletAccounts[1];

        // get receiver's wallet balance
        const receiverAccountBalanceBefore = await web3Client.wallet().getAccountBalance(receiverAccount.address);
        console.log(`Receiver Wallet Balance (Before): ${receiverAccount.address} with balance (candidate, final) = (${receiverAccountBalanceBefore?.candidate.toString()}, ${receiverAccountBalanceBefore?.final.toString()})`);

        // sign a random wallet message using account2
        const signedMessage = await web3Client.wallet().signMessage("hello there", receiverAccount.address);
        console.log("Wallet sender signing a message... ", signedMessage);

        // verify a signature
        // verify a signature
        const signature = {
          base58Encoded: "B1Gy7pAstdqzjghn8fdLDtn1qLUhsxWu4x1j8N4W9wxa3hTPNsFyPeFkSkfEjVCRnCAE9jrBjernGyoDL1yt2Wgafb8uu",
        };

        const message = "hello world";

        const isVerified = await web3Client.wallet().verifySignature(
          message,
          signature,
          "P1c6udwDMs6CY2YDUm7phdrv6S5ACjTV5jW4Kriio44yDpRWK8t"
        );
        console.log("Signature verification: ", isVerified);

        // send from base account to receiver
        const txId = await web3Client.wallet().sendTransaction({
          amount: fromMAS(1),
          fee: 0n,
          recipientAddress: receiverAccount.address,
        });
        console.log("Money Transfer:: TxId ", txId[0]);

        // await finalization
        console.log("Awaiting Finalization ...");
        await web3Client.smartContracts().awaitRequiredOperationStatus(txId[0], EOperationStatus.FINAL);

        console.log("Polling events ... ");
        const events = await EventPoller.getEventsOnce(
          {
            start: null,
            end: null,
            original_operation_id: txId[0],
            original_caller_address: null,
            emitter_address: null,
          },
          web3Client
        );
        console.log("Polled Events ", events);

        // get receiver's wallet after
        const receiverAccountBalanceAfter = await web3Client.wallet().getAccountBalance(receiverAccount.address);
        console.log(`Receiver Wallet Balance (After): ${receiverAccount.address} with balance (candidate, final) = (${receiverAccountBalanceAfter?.candidate.toString()}, ${receiverAccountBalanceAfter?.final.toString()})`);

        // get sender's wallet after
        const senderAccountBalanceAfter = await web3Client.wallet().getAccountBalance(senderAccount.address);
        console.log(`Sender Wallet Balance (After): ${receiverAccount.address} with balance (candidate, final) = (${senderAccountBalanceAfter?.candidate.toString()}, ${senderAccountBalanceAfter?.final.toString()})`);

        // sender buys some rolls
        const buyRollsTxId = await web3Client.wallet().buyRolls({
          amount: 2n,
          fee: fromMAS(0),
        });
        console.log("Buy Rolls Tx Id ", buyRollsTxId);
      } catch (ex) {
        console.error(ex);
      }
    },
  },
};
</script>