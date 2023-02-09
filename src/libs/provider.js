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
 * @param {import('ethers').Wallet} wallet
 * @param {ethers.providers.TransactionRequest} transaction
 * @return {Promise<String>}
 */
export async function sendTransactionViaWallet(wallet, transaction) {
  if (transaction.value) {
    // eslint-disable-next-line no-param-reassign
    transaction.value = BigNumber.from(transaction.value);
  }

  const approvedTx = await wallet.sendTransaction(transaction);

  const receipt = await approvedTx.wait(1);

  if (receipt.status === 0) {
    return TransactionState.Failed;
  }
  // Transaction was successful if status === 1
  // console.log("Receipt => ", receipt);
  return TransactionState.Sent;
}
