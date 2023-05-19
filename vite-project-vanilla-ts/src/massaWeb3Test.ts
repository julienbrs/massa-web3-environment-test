import {
  ClientFactory,
  IAccount,
  WalletClient,
  Client,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

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
  render(); // chaque fois que l'état change, on doit re-rendre
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
          </div>
          
        `
            : ""
        }
      </div>
    `;
}
