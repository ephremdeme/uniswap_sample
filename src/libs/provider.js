import { BigNumber, ethers } from "ethers";
import { INFURA_RPC_ADDRESS } from "./constants";
import ERC20_ABI from "./ERC20_abi.json";
import { fromReadableAmount } from "./utils";

export function getProvider() {
  return new ethers.providers.JsonRpcProvider(INFURA_RPC_ADDRESS, 5);
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
  return receipt.transactionHash;
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {Token} options.token
 * @param {Wallet} options.wallet
 * @param {String} options.contracAddress
 * @param {Number} options.amount
 *
 * @return {Promise<TransactionState>}
 */
export async function getTokenTransferApproval({
  token,
  wallet,
  amount,
  contracAddress,
}) {
  if (!wallet) {
    console.log("No Provider Found");
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      wallet.provider
    );

    const transaction = await tokenContract.populateTransaction.approve(
      contracAddress,
      fromReadableAmount(amount, token.decimals).toString()
    );
    return await sendTransactionViaWallet(wallet, {
      ...transaction,
      from: wallet.address,
    });
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}
