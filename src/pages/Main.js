import React, { useEffect, useReducer } from "react";
import {
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  Box,
  Badge,
  UnorderedList,
  ListItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/core";
// https://docs.ethers.io/v5/
import { ethers } from "ethers";
import {
  accountConnected2MetaMask,
  sendEtherTransaction,
} from "../utils/eth-utils";

//reducer to update web3 state : check if web3 injected, if connected to MetaMask, get account connected, balance...
const web3Reducer = (state, action) => {
  switch (action.type) {
    case "SET_isWeb3":
      return { ...state, isWeb3: action.isWeb3 };
    case "SET_isEnabled":
      return { ...state, isEnabled: action.isEnabled };
    case "SET_account":
      return { ...state, account: action.account };
    case "SET_provider":
      return { ...state, provider: action.provider };
    case "SET_network":
      return { ...state, network: action.network };
    case "SET_signer":
      return { ...state, signer: action.signer };
    case "SET_balance":
      return { ...state, balance: action.balance };
    default:
      throw new Error(`Unhandled action ${action.type} in web3Reducer`);
  }
};

const initialWeb3State = {
  isWeb3: false,
  isEnabled: false,
  account: ethers.constants.AddressZero,
  provider: null,
  signer: null,
  network: null,
  balance: "0",
};

//reducer to update specific dapp state: user chooses to connect to MetaMask, amount to buy
const dappReducer = (state, action) => {
  switch (action.type) {
    case "SET_isConnecting":
      return { ...state, isConnecting: action.isConnecting };
    case "SET_buyValue":
      return { ...state, buyValue: action.buyValue };
    default:
      throw new Error(`Unhandled action ${action.type} in dappReducer`);
  }
};

//ICO address receiving ethers and selling tokens with values shown in ethers
const initialDappState = {
  buyValue: 0.05,
  ratioEtherToToken: 10,
  isConnecting: false,
  myAddr: "0xB6e790Df0aB9Abb7E261e467Be6b65aF0d88E133",
};

function Main() {
  const [web3State, web3Dispatch] = useReducer(web3Reducer, initialWeb3State);
  const [dappState, dappDispatch] = useReducer(dappReducer, initialDappState);

  //event handler when clicking to connect to MetaMask
  const handleConnectButtonClick = () => {
    if (!web3State.isEnabled)
      dappDispatch({ type: "SET_isConnecting", isConnecting: true });
  };

  //event handler to change value to buy
  const handleChangeValue = (currentBuyValue) => {
    dappDispatch({
      type: "SET_buyValue",
      buyValue: currentBuyValue,
    });
  };

  const handleBuyButtonClick = async () =>
    await sendEtherTransaction(web3State.signer, web3State.provider, {
      to: dappState.myAddr,
      value: String(ethers.utils.parseEther(dappState.buyValue)),
    });

  // Check if Web3 is injected only on mount
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      web3Dispatch({ type: "SET_isWeb3", isWeb3: true });
    } else {
      web3Dispatch({ type: "SET_isWeb3", isWeb3: false });
    }
  }, []);

  // Check if already connected to MetaMask on mount and when isWeb3 from web3State changes value
  useEffect(() => {
    const checkIfConnected = async () => {
      const account = await accountConnected2MetaMask();
      // if connected set account to connected address, if not: ""
      if (account) {
        web3Dispatch({ type: "SET_isEnabled", isEnabled: true });
        web3Dispatch({ type: "SET_account", account: account });
      } else {
        web3Dispatch({ type: "SET_isEnabled", isEnabled: false });
      }
    };
    //set isEnabled/account only if web3 is injected (isWeb3 === true)
    if (web3State.isWeb3) {
      checkIfConnected();
    }
  }, [web3State.isWeb3]);

  //If not connected to MetaMask, user connects by clicking button
  useEffect(() => {
    const connect2MetaMask = async () => {
      try {
        //MetaMask pop-up to ask for connection (method: "eth_requestAccounts"), account is an array with one address in a string
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        web3Dispatch({ type: "SET_isEnabled", isEnabled: true });
        web3Dispatch({ type: "SET_account", account: accounts[0] });
      } catch (e) {
        web3Dispatch({ type: "SET_isEnabled", isEnabled: false });
        web3Dispatch({
          type: "SET_account",
          account: initialWeb3State.account,
        });
        console.log("connect to MetaMask error :", e);
      } finally {
        dappDispatch({ type: "SET_isConnecting", isConnecting: false });
      }
    };
    /*call connect2MetaMask only if web3 injected, not connected already and user
clicked the button to connect (so set isConnecting to true). If connected set
isEnabled to true and account, if error set isEnabled to false and account to
initial address 0. In any case, success or failure, close the connecting phase
(similar to loading) and set isConnecting to false.*/
    if (web3State.isWeb3 && !web3State.isEnabled && dappState.isConnecting) {
      connect2MetaMask();
    }
    //dependency array with variables of if clause
  }, [web3State.isWeb3, dappState.isConnecting, web3State.isEnabled]);

  // Connect to provider via ethers methods
  useEffect(() => {
    const connect2Provider = async () => {
      try {
        /*Create a new Web3Provider, which wraps an existing Web3-compatible
        external Provider (window.ethereum created by MetaMask) and expose it
        as an ethers.js Provider which can then be used with the rest of the
        library.*/
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        web3Dispatch({ type: "SET_provider", provider });
        console.log(provider);

        /*Returns a JsonRpcSigner which is managed by this Ethereum node and has
        inherits from Signer sendTransaction method */
        const signer = provider.getSigner();
        web3Dispatch({ type: "SET_signer", signer });
        console.log(signer);

        //Returns the Network object this Provider is connected to
        const network = await provider.getNetwork();
        web3Dispatch({ type: "SET_network", network });
        console.log(network);

        // Returns the balance of address in wei as a Big Number
        const _balance = await provider.getBalance(web3State.account);
        /*parseEther( etherString ) and formatEther( wei ) are used to
        convert between string representations (in Ether), which are displayed to or
        entered by the user and Big Number representations which can have
        mathematical operations handled safely. */
        const balance = ethers.utils.formatEther(_balance);
        web3Dispatch({ type: "SET_balance", balance });
        console.log(_balance);
      } catch (e) {
        web3Dispatch({
          type: "SET_network",
          network: initialWeb3State.network,
        });
        web3Dispatch({
          type: "SET_balance",
          balance: initialWeb3State.balance,
        });
        console.log("connect to provider error :", e);
      }
    };
    //connect to provider only if connected to MetaMask and account is not address 0
    if (
      web3State.isEnabled &&
      web3State.account !== ethers.constants.AddressZero
    ) {
      connect2Provider();
    }
  }, [web3State.isEnabled, web3State.account]);

  return (
    <>
      <VStack>
        <Heading as="h1" mb={5}>
          Web3 demo
        </Heading>
        <Heading mb={10} size="lg">
          Connection, transaction and smart contracts
        </Heading>

        {!web3State.isWeb3 && <Text>Please install MetaMask</Text>}

        {web3State.isWeb3 && (
          <Box mb={3} alignItems="baseline">
            MetaMask status:{" "}
            {web3State.isEnabled ? (
              <Badge colorScheme="green">connected</Badge>
            ) : (
              <Badge colorScheme="red">disconnected</Badge>
            )}
          </Box>
        )}

        {web3State.isEnabled &&
          web3State.network !== null &&
          web3State.account !== ethers.constants.AddressZero && (
            <>
              <UnorderedList>
                <ListItem mb={3}>
                  Account: <Text as="b">{web3State.account}</Text>
                </ListItem>
                <ListItem mb={3}>
                  Balance: <Text as="b">{web3State.balance}</Text>
                </ListItem>
                <ListItem mb={3}>
                  Network name: <Text as="b">{web3State.network.name}</Text>
                </ListItem>
                <ListItem mb={3}>
                  Network id: <Text as="b">{web3State.network.chainId}</Text>
                </ListItem>
              </UnorderedList>
              <HStack>
                <NumberInput
                  value={dappState.buyValue}
                  defaultValue={initialDappState.buyValue}
                  precision={2}
                  step={0.05}
                  min={0}
                  max={web3State.balance}
                  onChange={handleChangeValue}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>

                <Button onClick={handleBuyButtonClick}>
                  Buy New tokens for {dappState.buyValue} ETH
                </Button>
              </HStack>
              <Text as="i">1 ether for 10 New tokens</Text>
            </>
          )}
        {!web3State.isEnabled && (
          <Button onClick={handleConnectButtonClick}>Connect</Button>
        )}
      </VStack>
    </>
  );
}

export default Main;
