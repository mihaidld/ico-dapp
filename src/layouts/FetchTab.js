import React, { useEffect, useReducer } from "react";
import axios from "axios";
import {
  Heading,
  Text,
  FormControl,
  Input,
  HStack,
  VStack,
  Button,
  Link,
  UnorderedList,
  ListItem,
  Spinner,
} from "@chakra-ui/core";

const fetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, isLoading: true, isError: false };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, isError: true };
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "SET_URL":
      return { ...state, url: action.payload };
    default:
      throw new Error(`Unhandled action ${action.type} in fetchReducer`);
  }
};

function FetchTab() {
  const initialState = {
    data: { hits: [] },
    query: "redux",
    url: "https://hn.algolia.com/api/v1/search?query=redux",
    isLoading: false,
    isError: false,
  };

  const [state, dispatch] = useReducer(fetchReducer, initialState);
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(state.url);
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
      } catch (error) {
        dispatch({ type: "FETCH_FAILURE" });
      }
    };
    fetchData();
  }, [state.url]);

  return (
    <VStack>
      <Heading mb={5}>
        Fetch content with <Text as="i">useEffect</Text> hook
      </Heading>
      <Heading as="h3" mb={10}>
        and manage state with <Text as="i">useReducer</Text> hook
      </Heading>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({
            type: "SET_URL",
            payload: `http://hn.algolia.com/api/v1/search?query=${state.query}`,
          });
          event.target.reset();
        }}
      >
        <FormControl id="search-term" isRequired>
          <HStack>
            <Input
              type="text"
              value={state.query}
              placeholder="e.g. react"
              mb={5}
              onChange={(event) =>
                dispatch({ type: "SET_QUERY", payload: event.target.value })
              }
            />
            <Button
              type="submit"
              isLoading={state.isLoading}
              loadingText="Searching"
              colorScheme="blue"
              mb={5}
            >
              Search
            </Button>
          </HStack>
        </FormControl>
      </form>
      {state.isError && <div>Something went wrong ...</div>}
      {state.isLoading ? (
        <Spinner />
      ) : (
        <UnorderedList>
          {state.data.hits.map((item) => (
            <ListItem key={item.objectID}>
              <Link href={item.url} isExternal>
                {item.title}
              </Link>
            </ListItem>
          ))}
        </UnorderedList>
      )}
    </VStack>
  );
}

export default FetchTab;
