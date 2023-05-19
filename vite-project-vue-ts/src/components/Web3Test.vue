<template>
  <div>
    <h1>Test Massa Web3</h1>
    <div v-if="deployer">
      <h2>Deployer informations</h2>
      <p>Deployer Address: {{ deployer.address }}</p>
      <p>Deployer Public Key: {{ deployer.publicKey }}</p>
      <p>Deployer Private Key: {{ deployer.secretKey }}</p>

      <h2 style="margin-top: 50px">Wallet Test</h2>
      <WalletTest :deployerPrivateKey="deployer.secretKey" />

      <h2 style="margin-top: 50px">Smart Contract Interaction Test</h2>
      <!-- <SCInteraction :deployerPrivateKey="deployer.secretKey" /> -->
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import WalletTest from "./WalletTest.vue";
// import SCInteraction from "./SCTest.vue";
import {
  ClientFactory,
  WalletClient,
  Client,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

const secretKey = "S12tw4YShWtjWfy7YBQ9Erbcg6DYgWnMgb5hGjn9hAKGtgrLNa7L";

export default {
  components: {
    WalletTest,
    // SCInteraction,
  },
  setup() {
    const deployer = ref(null);

    const init = async () => {
      const baseAccount = await WalletClient.getAccountFromSecretKey(secretKey);

      const testnetClient = await ClientFactory.createDefaultClient(
        DefaultProviderUrls.TESTNET,
        true,
        baseAccount
      );
      deployer.value = testnetClient.wallet().getBaseAccount();
    };

    onMounted(init);

    return {
      deployer,
    };
  },
};
</script>