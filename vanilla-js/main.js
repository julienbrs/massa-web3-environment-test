
import { WalletTest } from "./walletTest.js";
import { SCInteraction } from "./SCTest.js";

  
  window.WalletTest = WalletTest;
  window.SCInteraction = SCInteraction;
  
  const secretKey = "S12tw4YShWtjWfy7YBQ9Erbcg6DYgWnMgb5hGjn9hAKGtgrLNa7L";
  
  let deployer = null;
  
  const init = async () => {
    const baseAccount = await window.massa.WalletClient.getAccountFromSecretKey(secretKey);
    console.log("baseAccount", baseAccount);
  
    const testnetClient = await window.massa.ClientFactory.createDefaultClient(
        window.massa.DefaultProviderUrls.TESTNET,
      true,
      baseAccount
    );
    deployer = testnetClient.wallet().getBaseAccount();
    render();
  };
  
  init();
  
  function render() {
    const appDiv = document.querySelector("#app");
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
  
            <h2 style="marginTop: 50px;">Wallet Test</h2>
            // <button onclick="WalletTest('${deployer.secretKey}')">Wallet Test</button>
  
            <h2 style="marginTop: 50px;">Smart Contract Interaction Test</h2>
            // <button onclick="SCInteraction('${deployer.secretKey}')">Smart Contract Interaction Test</button>
          </div>
          `
            : ""
        }
      </div>
    `;
  }
  