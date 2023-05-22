async function checkBalance(web3Client, account, requiredBalance) {
  const balance = await web3Client.wallet().getAccountBalance(account.address);
  if (!balance?.final || balance.final < requiredBalance) {
    throw new Error("Insufficient MAS balance.");
  }
}

export async function awaitTxConfirmation(web3Client, deploymentOperationId) {
  console.log(`Awaiting FINAL transaction status....`);
  let status = EOperationStatus.AWAITING_INCLUSION;
  try {
    status = await web3Client
      .smartContracts()
      .awaitRequiredOperationStatus(
        deploymentOperationId,
        EOperationStatus.FINAL
      );
    console.log(
      `Transaction with Operation ID ${deploymentOperationId} has reached finality!`
    );
  } catch (ex) {
    const msg = `Error getting finality of transaction ${deploymentOperationId}`;
    console.error(msg);
    console.error(ex);
  }

  if (status !== EOperationStatus.FINAL) {
    throw new Error(
      `Transaction with Operation ID ${deploymentOperationId} has not reached finality!`
    );
  }
}

export async function deploySmartContracts(
  contractsToDeploy,
  web3Client,
  maxCoins,
  fee = 0n,
  maxGas = 1_000_000n,
  deployerAccount
) {
  let deploymentOperationId;
  try {
    if (!deployerAccount) {
      const baseAccount = web3Client.wallet().getBaseAccount();
      if (baseAccount) {
        deployerAccount = baseAccount;
      } else {
        throw new Error("Unable to get deployer account.");
      }
    }

    const coinsRequired = contractsToDeploy.reduce(
      (acc, contract) => acc + contract.coins,
      0n
    );
    await checkBalance(web3Client, deployerAccount, coinsRequired);

    const datastore = new Map();

    datastore.set(
      new Uint8Array([0x00]),
      u64ToBytes(BigInt(contractsToDeploy.length))
    );

    for (let i = 0; i < contractsToDeploy.length; i++) {
      const contract = contractsToDeploy[i];

      datastore.set(u64ToBytes(BigInt(i + 1)), contract.data);
      if (contract.args) {
        datastore.set(
          new Uint8Array(
            new Args()
              .addU64(BigInt(i + 1))
              .addUint8Array(u8toByte(0))
              .serialize()
          ),
          new Uint8Array(contract.args.serialize())
        );
      }
      if (contract.coins > 0) {
        datastore.set(
          new Uint8Array(
            new Args()
              .addU64(BigInt(i + 1))
              .addUint8Array(u8toByte(1))
              .serialize()
          ),
          u64ToBytes(contract.coins)
        );
      }
    }

    console.log(`Running "deployment" of smart contract....`);
    try {
      const coins = contractsToDeploy.reduce(
        (acc, contract) => contract.coins + acc,
        0n
      );
      console.log("Sending coins ... ", coins.toString());

      console.log("Running deployment of deployer smart contract....");
      const response = await fetch("src/contracts/deployer.wasm");
      const wasmBytes = await response.arrayBuffer();
      const contractData = {
        contractDataBinary: new Uint8Array(wasmBytes),
        datastore,
        fee,
        maxCoins,
        maxGas,
      };
      deploymentOperationId = await web3Client
        .smartContracts()
        .deploySmartContract(contractData, deployerAccount);
      console.log(
        `Smart Contract "successfully" deployed to Massa Network. Operation ID ${deploymentOperationId}`
      );
    } catch (ex) {
      const msg = "Error deploying deployer smart contract to Massa Network";
      console.error(msg);
      deploymentOperationId = "";
    }
  } catch (ex) {
    const msg = "Error deploying deployer smart contract to Massa Network";
    console.error(msg);
    deploymentOperationId = "";
  }
  console.log("Smart Contract Deployment finished!");
  return deploymentOperationId;
}
