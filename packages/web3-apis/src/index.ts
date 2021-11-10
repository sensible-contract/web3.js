import { SensibleApi } from "./Sensible";
export * from "./Sensible";
export type UTXO = {
  txId: string;
  outputIndex: number;
  satoshis: number;
  address: string;
};

export function GetDefaultApis(apiNet: "mainnet" | "testnet" = "mainnet") {
  return new SensibleApi(apiNet);
}

//sensible
export type NonFungibleTokenUnspent = {
  txId: string;
  outputIndex: number;
  tokenAddress: string;
  tokenIndex: string;
  metaTxId: string;
  metaOutputIndex: number;
};

export type FungibleTokenUnspent = {
  txId: string;
  outputIndex: number;
  tokenAddress: string;
  tokenAmount: string;
};

export type FungibleTokenSummary = {
  codehash: string;
  genesis: string;
  sensibleId: string;
  pendingBalance: string;
  balance: string;
  symbol: string;
  decimal: number;
};

export type NonFungibleTokenSummary = {
  codehash: string;
  genesis: string;
  sensibleId: string;
  count: string;
  pendingCount: string;
  metaTxId: string;
  metaOutputIndex: number;
  supply: string;
};

export type FungibleTokenBalance = {
  balance: string;
  pendingBalance: string;
  utxoCount: number;
  decimal: number;
};

export type NftSellUtxo = {
  codehash: string;
  genesis: string;
  tokenIndex: string;
  txId: string;
  outputIndex: number;
  sellerAddress: string;
  satoshisPrice: number;
};

export type OutpointSpent = {
  spentTxId: string;
  spentInputIndex: number;
};
