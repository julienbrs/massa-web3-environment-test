/* eslint-disable @typescript-eslint/no-var-requires */
import { IAccount } from "@massalabs/massa-web3";
import { Client } from "@massalabs/massa-web3";
import { EOperationStatus } from "@massalabs/massa-web3";
import { Args } from "@massalabs/massa-web3";
import { u64ToBytes, u8toByte } from "@massalabs/massa-web3";

interface ISCData {
  data: Uint8Array;
  args?: Args;
  coins: bigint;
}

async function checkBalance(
  web3Client: Client,
  account: IAccount,
  requiredBalance: bigint
) {
  const balance = await web3Client
    .wallet()
    .getAccountBalance(account.address as string);
  if (!balance?.final || balance.final < requiredBalance) {
    throw new Error("Insufficient MAS balance.");
  }
}

export async function awaitTxConfirmation(
  web3Client: Client,
  deploymentOperationId: string
): Promise<void> {
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

export const deploySmartContracts = async (
  contractsToDeploy: ISCData[],
  web3Client: Client,
  maxCoins: bigint,
  fee = 0n,
  maxGas = 1_000_000n,
  deployerAccount?: IAccount
): Promise<string> => {
  let deploymentOperationId: string;
  try {
    // do checks
    if (!deployerAccount) {
      const baseAccount = web3Client.wallet().getBaseAccount();
      if (baseAccount) {
        deployerAccount = baseAccount;
      } else {
        throw new Error("Unable to get deployer account.");
      }
    }

    // check deployer account balance
    const coinsRequired = contractsToDeploy.reduce(
      (acc, contract) => acc + contract.coins,
      0n
    );
    await checkBalance(web3Client, deployerAccount, coinsRequired);

    // construct a new datastore
    const datastore = new Map<Uint8Array, Uint8Array>();

    // set the number of contracts
    datastore.set(
      new Uint8Array([0x00]),
      u64ToBytes(BigInt(contractsToDeploy.length))
    );
    // loop through all contracts and fill datastore
    for (let i = 0; i < contractsToDeploy.length; i++) {
      const contract: ISCData = contractsToDeploy[i];

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
          u64ToBytes(contract.coins) // scaled value to be provided here
        );
      }
    }

    // deploy deployer contract
    console.log(`Running "deployment" of smart contract....`);
    try {
      const coins = contractsToDeploy.reduce(
        // scaled value to be provided here
        (acc, contract) => contract.coins + acc,
        0n
      );
      console.log("Sending coins ... ", coins.toString());

      console.log("Running deployment of deployer smart contract....");
      const response = await fetch("/contracts/deployer.wasm");
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
      const msg = `Error deploying deployer smart contract to Massa Network`;
      console.error(msg);
      deploymentOperationId = "";
    }
  } catch (ex) {
    const msg = `Error deploying deployer smart contract to Massa Network`;
    console.error(msg);
    deploymentOperationId = "";
  }
  console.log(`Smart Contract Deployment finished!`);

  return deploymentOperationId;
};
