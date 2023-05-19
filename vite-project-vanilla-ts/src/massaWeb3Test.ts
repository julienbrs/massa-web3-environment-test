import {
  ClientFactory,
  IAccount,
  WalletClient,
  Client,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

import { WalletTest } from "./walletTest";
import { SCInteraction } from "./SCTest";

declare global {
  interface Window {
    WalletTest: typeof WalletTest;
    SCInteraction: typeof SCInteraction;
  }
}

window.WalletTest = WalletTest;
window.SCInteraction = SCInteraction;

const secretKey = "S12tw4YShWtjWfy7YBQ9Erbcg6DYgWnMgb5hGjn9hAKGtgrLNa7L";

let deployer: IAccount | null = null;

const init = async () => {
  const baseAccount = await WalletClient.getAccountFromSecretKey(secretKey);

  const testnetClient: Client = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.TESTNET,
    true,
    baseAccount
  );
  deployer = testnetClient.wallet().getBaseAccount();
  render();
};

init();

function render() {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  appDiv.innerHTML = `
      <div>
        <h1>Test Massa Web3</h1>
        ${
          deployer
            ? `
          <div>
            <h2>Deployer informations</h2>
            <p>Deployer Address: ${deployer.address}</p>
            <p>Deployer Public Key: ${deployer.publicKey}</p>
            <p>Deployer Private Key: ${deployer.secretKey}</p>

            <h2 style={{ marginTop: "50px" }}>Wallet Test</h2>
            <button onclick="WalletTest('${deployer.secretKey}')">Wallet Test</button>
  
            <h2 style={{ marginTop: "50px" }}>Smart Contract Interaction Test</h2>
            <button onclick="SCInteraction('${deployer.secretKey}')">Smart Contract Interaction Test</button>
          </div>
          
        `
            : ""
        }
      </div>
    `;
}
