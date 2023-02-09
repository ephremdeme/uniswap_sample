import { BigNumber, ethers } from "ethers";
import { INFURA_GORLI_RPC } from "./constants";

export function getProvider() {
  return new ethers.providers.JsonRpcProvider(INFURA_GORLI_RPC, 5);
}

export const TransactionState = {
  Failed: "Failed",
  New: "New",
  Rejected: "Rejected",
  Sending: "Sending",
  Sent: "Sent",
};

/**
 *
 * @param {providers.Provider} provider
 * @param {ethers.providers.TransactionRequest} transaction
 * @param {ethers.Wallet} wallet
 * @return {Promise<TransactionState>}
 */
export async function sendTransactionViaWallet(provider, wallet, transaction) {
  if (transaction.value) {
    // eslint-disable-next-line no-param-reassign
    transaction.value = BigNumber.from(transaction.value);
  }
  const txRes = await wallet.sendTransaction(transaction);

  let receipt = null;

  if (!provider) {
    return TransactionState.Failed;
  }

  while (receipt === null) {
    try {
      // eslint-disable-next-line no-await-in-loop
      receipt = await provider.getTransactionReceipt(txRes.hash);

      if (receipt === null) {
        // eslint-disable-next-line no-continue
        continue;
      }
    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent;
  }
  return TransactionState.Failed;
}
