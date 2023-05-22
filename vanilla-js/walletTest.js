const publicApi = "http://127.0.0.1:33035/";
const privateApi = "http://127.0.0.1:330342";

export async function WalletTest(deployerPrivateKey) {
  const receiverPrivateKey =
    "S1ykLaxXyMnJoaWLYds8UntqKTamZ4vcxrZ1fdToR8WpWEpk3FC";

  try {
    console.log("Deployer Wallet ", deployerPrivateKey);
    const deployerAccount = await WalletClient.getAccountFromSecretKey(
      deployerPrivateKey
    );
    console.log("Deployer Wallet ", deployerAccount);
    const web3Client = await ClientFactory.createCustomClient(
      [
        { url: publicApi, type: ProviderType.PUBLIC },
        { url: privateApi, type: ProviderType.PRIVATE },
      ],
      true,
      deployerAccount
    );

    const deployerAccountBalance = await web3Client
      .wallet()
      .getAccountBalance(deployerAccount.address);
    console.log(
      `Deployer Wallet Address: ${
        deployerAccount.address
      } with balance (candidate, final) = (${deployerAccountBalance?.candidate.toString()}, ${deployerAccountBalance?.final.toString()})`
    );

    let walletAccounts = await web3Client.wallet().getWalletAccounts();
    console.log("Wallet Accounts ", walletAccounts);
    const walletInfo = await web3Client.wallet().walletInfo();
    console.log("Wallet Info ", walletInfo);
    console.log("Adding a new Account ...");
    await web3Client.wallet().addSecretKeysToWallet([receiverPrivateKey]);
    walletAccounts = await web3Client.wallet().getWalletAccounts();
    console.log("Wallet Accounts (UPDATED) ", walletAccounts);
    const senderAccount = walletAccounts[0];
    const receiverAccount = walletAccounts[1];

    const receiverAccountBalanceBefore = await web3Client
      .wallet()
      .getAccountBalance(receiverAccount.address);
    console.log(
      `Receiver Wallet Balance (Before): ${
        receiverAccount.address
      } with balance (candidate, final) = (${receiverAccountBalanceBefore?.candidate.toString()}, ${receiverAccountBalanceBefore?.final.toString()})`
    );

    const signedMessage = await web3Client
      .wallet()
      .signMessage("hello there", receiverAccount.address);
    console.log("Wallet sender signing a message... ", signedMessage);

    const signature = {
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

    const txId = await web3Client.wallet().sendTransaction({
      amount: fromMAS(1),
      fee: 0n,
      recipientAddress: receiverAccount.address,
    });
    console.log("Money Transfer:: TxId ", txId[0]);

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
      },
      web3Client
    );
    console.log("Polled Events ", events);

    const receiverAccountBalanceAfter = await web3Client
      .wallet()
      .getAccountBalance(receiverAccount.address);
    console.log(
      `Receiver Wallet Balance (After): ${
        receiverAccount.address
      } with balance (candidate, final) = (${receiverAccountBalanceAfter?.candidate.toString()}, ${receiverAccountBalanceAfter?.final.toString()})`
    );

    const senderAccountBalanceAfter = await web3Client
      .wallet()
      .getAccountBalance(senderAccount.address);
    console.log(
      `Sender Wallet Balance (After): ${
        receiverAccount.address
      } with balance (candidate, final) = (${senderAccountBalanceAfter?.candidate.toString()}, ${senderAccountBalanceAfter?.final.toString()})`
    );

    const buyRollsTxId = await web3Client.wallet().buyRolls({
      amount: 2n,
      fee: fromMAS(0),
    });
    console.log("Buy Rolls Tx Id ", buyRollsTxId);
  } catch (ex) {
    console.error(ex);
  }
}
