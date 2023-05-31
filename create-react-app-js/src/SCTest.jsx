import React from "react";
import {
  ClientFactory,
  WalletClient,
  Args,
  EventPoller,
  ON_MASSA_EVENT_DATA,
  ON_MASSA_EVENT_ERROR,
  strToBytes,
  ProviderType,
  fromMAS,
  toMAS,
} from "@massalabs/massa-web3";

import { withTimeoutRejection } from "@massalabs/massa-web3/dist/esm/utils/time";

import { awaitTxConfirmation, deploySmartContracts } from "./utils/Deployer.ts";

class MusicAlbum {
  constructor(id = "", title = "", artist = "", album = "", year = 0) {}

  serialize() {
    const args = new Args();
    args.addString(this.id);
    args.addString(this.title);
    args.addString(this.artist);
    args.addString(this.album);
    args.addU64(this.year);
    return Uint8Array.from(args.serialize());
  }

  deserialize(data, offset) {
    const args = new Args(data, offset);

    const id = args.nextString();
    this.id = id;

    const title = args.nextString();
    this.title = title;

    const artist = args.nextString();
    this.artist = artist;

    const album = args.nextString();
    this.album = album;

    const year = args.nextU64();
    this.year = Number(year);

    return {
      instance: this,
      offset: args.getOffset(),
    };
  }
}

// const publicApi = "https://test.massa.net/api/v2";
const publicApi = "http://127.0.0.1:33035/";

// const privateApi = "https://test.massa.net/api/v2";
const privateApi = "http://127.0.0.1:330342";

const receiverPrivateKey =
  "S1ykLaxXyMnJoaWLYds8UntqKTamZ4vcxrZ1fdToR8WpWEpk3FC";

const MASSA_EXEC_ERROR = "massa_execution_error";

const pollAsyncEvents = async (web3Client, opId) => {
  // determine the last slot
  const nodeStatusInfo = await web3Client.publicApi().getNodeStatus();

  // set the events filter
  const eventsFilter = {
    start: nodeStatusInfo.last_slot,
    end: null,
    original_caller_address: null,
    original_operation_id: opId,
    emitter_address: null,
    is_final: false,
  };

  const eventPoller = EventPoller.startEventsPolling(
    eventsFilter,
    1000,
    web3Client
  );

  return new Promise((resolve, reject) => {
    eventPoller.on(ON_MASSA_EVENT_DATA, (events) => {
      console.log("Event Data Received:", events);
      const errorEvents = events.filter((e) =>
        e.data.includes(MASSA_EXEC_ERROR)
      );
      if (errorEvents.length > 0) {
        return resolve({
          isError: true,
          eventPoller,
          events: errorEvents,
        });
      }

      if (events.length) {
        return resolve({
          isError: false,
          eventPoller,
          events,
        });
      } else {
        console.log("No events have been emitted during deployment");
      }
    });
    eventPoller.on(ON_MASSA_EVENT_ERROR, (error) => {
      console.log("Event Data Error:", error);
      return reject(error);
    });
  });
};

export default function SCInteraction({ deployerPrivateKey }) {
  console.log("Massa Smart Contract Interaction Example");

  const init = async () => {
    try {
      // init client
      const deployerAccount = await WalletClient.getAccountFromSecretKey(
        deployerPrivateKey
      );

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
        } with balance (candidate, final) = (${toMAS(
          deployerAccountBalance?.candidate.toString()
        )}, ${toMAS(deployerAccountBalance?.final.toString())})`
      );

      // deploy smart contract
      console.log("Running deployment of deployer smart contract....");
      
      const response = await fetch("src/contracts/sc_code.ts");
      const wasmBytes = await response.arrayBuffer();
      const wasmArray = new Uint8Array(wasmBytes);
      const deploymentOperationId = await deploySmartContracts(
        [
          {
            data: wasmArray,
            args: undefined,
            coins: fromMAS(0.1),
          },
        ],
        web3Client,
        fromMAS(0.1),
        0n,
        1_000_000n,
        deployerAccount
      );
      console.log(
        `Deployed Smart Contract "successfully" with opId ${deploymentOperationId}`
      );

      // async poll events in the background for the given opId
      const { isError, eventPoller, events } = await withTimeoutRejection(
        pollAsyncEvents(web3Client, deploymentOperationId),
        20000
      );

      // stop polling
      eventPoller.stopPolling();

      // if errors, don't await finalization
      if (isError) {
        throw new Error(
          `Massa Deployment Error: ${JSON.stringify(events, null, 4)}`
        );
      }

      // await finalization
      await awaitTxConfirmation(web3Client, deploymentOperationId);

      // find an event that contains the emitted sc address
      console.log("Extracting deployed sc address from events....");
      const addressEvent = events.find((event) =>
        event.data.includes("Contract deployed at address")
      );
      if (!addressEvent) {
        throw new Error(
          "No events were emitted from contract containing a message `SC created at:...`. Please make sure to include such a message in order to fetch the sc address"
        );
      }
      const scAddress = addressEvent.data.split(":")[1].trim();
      console.log(`Smart Contract Address: ${scAddress}`);

      // =========================================
      // get function return value: get the music album
      console.log(
        "Getting a function return value from the deployed smart contract..."
      );
      const args = new Args().addString("1");
      const result = await web3Client.smartContracts().readSmartContract({
        fee: 0n,
        maxGas: 700_000n,
        targetAddress: scAddress,
        targetFunction: "getMusicAlbum",
        parameter: args.serialize(),
      });

      const res = new Args(result.returnValue, 0);
      const musicAlbum = res.nextSerializable(MusicAlbum);
      console.log(
        `Function Return Value: ${JSON.stringify(musicAlbum, null, 4)}`
      );

      // =========================================
      // make a smart contract call: delete the music album
      console.log("Calling a set function on the deployed smart contract...");
      const deleteMusicAlbumArgs = new Args().addString("1");
      const deleteMusicAlbumCallOperationId = await web3Client
        .smartContracts()
        .callSmartContract({
          fee: 0n,
          maxGas: 10_500_000,
          coins: 0n,
          targetAddress: scAddress,
          functionName: "deleteMusicAlbum",
          parameter: deleteMusicAlbumArgs.serialize(),
        });
      console.log(
        `Delete Music Album operation ID: ${deleteMusicAlbumCallOperationId}`
      );

      // await finalization
      await awaitTxConfirmation(web3Client, deleteMusicAlbumCallOperationId);

      // =========================================
      // make a smart contract call: create a new music album
      console.log(`Calling a set function on the deployed smart contract...`);
      const newMusicAlbum = new MusicAlbum(
        "1",
        "CD",
        "The Beatles",
        "Let It Be",
        1970
      );
      const createMusicAlbumCallArgs = new Args(newMusicAlbum.serialize());
      const createMusicAlbumCallOperationId = await web3Client
        .smartContracts()
        .callSmartContract({
          fee: 0n,
          maxGas: 10_500_000,
          coins: 0n,
          targetAddress: scAddress,
          functionName: "addMusicAlbum",
          parameter: createMusicAlbumCallArgs.serialize(),
        });
      console.log(
        `Create Music Album Operation ID: ${createMusicAlbumCallOperationId}`
      );

      // await finalization
      await awaitTxConfirmation(web3Client, createMusicAlbumCallOperationId);

      // =========================================
      // read value from store: read music album content
      console.log(
        `Reading Music Album from the deployed smart contract storage...`
      );
      const scStorage = await web3Client.publicApi().getDatastoreEntries([
        {
          address: scAddress,
          key: strToBytes(`MUSIC_ALBUM_KEY_1`),
        },
      ]);
      if (!scStorage[0].final_value) {
        console.log(`Storage contains null for that key. Something is wrong`);
      } else {
        const res = new Args(scStorage[0].final_value, 0);
        const musicAlbum = res.nextSerializable(MusicAlbum);
        console.log(
          `Music Album from Storage: ${JSON.stringify(musicAlbum, null, 4)}`
        );
      }

      // =========================================
      // read contract balance
      console.log(`Getting deployed smart contract balance...`);
      const contractBalance = await web3Client
        .smartContracts()
        .getContractBalance(scAddress);
      console.log(
        `Deployed smart contract balance (candidate, final) = $(${toMAS(
          contractBalance?.candidate.toString()
        )},${toMAS(contractBalance?.final.toString())})`
      );
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
