// If connected to MetaMask returns the current account : string address
// else return ""
export const accountConnected2MetaMask = async () => {
  /*If not connected accounts will be an empty array
    uses request method: "eth_accounts" from JSON-RPC to view address without requesting to connect to Metamask
    no need for try/catch since no error*/
  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });
  if (accounts.length === 0) {
    return null;
    //return "";
  }
  return accounts[0];
};

// send `transaction`, in ethers, from signer address, with as parameter a transaction object (with 2 properties "to" and "value")
export const sendEtherTransaction = async (signer, provider, transaction) => {
  try {
    // send the transaction and return a transaction response
    const tx = await signer.sendTransaction(transaction);
    // wait for tx.hash to be mined with 3 block validation and a timeout of 120 seconds
    // if succeed returns a receipt of the transaction
    const receipt = await provider.waitForTransaction(tx.hash, 3, 120000);
    return receipt;
  } catch (e) {
    console.log("error sendEtherTransaction :", e);
    return null;
  }
};
