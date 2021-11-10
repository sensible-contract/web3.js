import { Http } from "./httpRequest";
import {
  FungibleTokenBalance,
  FungibleTokenSummary,
  FungibleTokenUnspent,
  NonFungibleTokenSummary,
  NonFungibleTokenUnspent,
  UTXO,
} from "./index";

async function customGet(url: string, params?: any) {
  let _res = await Http.getRequest(url, params);
  if (_res.status != 200) {
    throw new Error(`request failed. url: ${url} status: ${_res.status}`);
  }
  if (_res.data.code != 0) {
    throw new Error(
      `request failed. url: ${url} code: ${_res.data.code} msg: ${_res.data.msg}`
    );
  }
  return _res.data.data;
}

async function customPost(url: string, body?: any) {
  let _res = await Http.postRequest(url, null, body);
  if (_res.status != 200) {
    throw new Error(`request failed. url: ${url} status: ${_res.status}`);
  }
  if (_res.data.code != 0) {
    throw new Error(
      `request failed. url: ${url} code: ${_res.data.code} msg: ${_res.data.msg}`
    );
  }
  return _res.data.data;
}

export class SensibleApi {
  serverBase: string;
  constructor(apiNet: "mainnet" | "testnet") {
    if (apiNet == "mainnet") {
      this.serverBase = "https://api.sensiblequery.com";
    } else {
      this.serverBase = "https://api.sensiblequery.com/test";
    }
  }

  //implement basic
  async getUnspents(address: string): Promise<UTXO[]> {
    let url = `${this.serverBase}/address/${address}/utxo?size=100`;
    let data = await customGet(url);
    let ret: UTXO[] = data.map((v: any) => ({
      txId: v.txid,
      outputIndex: v.vout,
      satoshis: v.satoshi,
      address: address,
    }));
    return ret;
  }

  async getRawTxData(txid: string) {
    let url = `${this.serverBase}/rawtx/${txid}`;
    let data = await customGet(url);
    return data;
  }

  async broadcast(hex: string) {
    let url = `${this.serverBase}/pushtx`;
    let data = await customPost(url, { txHex: hex });
    return data;
  }

  async getBalance(address: string) {
    let url = `${this.serverBase}/address/${address}/balance`;
    let data = await customGet(url);
    return data.satoshi + data.pendingSatoshi;
  }

  //implement sensible
  public async getFungibleTokenUnspents(
    codehash: string,
    genesis: string,
    address: string,
    size: number = 20
  ): Promise<FungibleTokenUnspent[]> {
    let url = `${this.serverBase}/ft/utxo/${codehash}/${genesis}/${address}?size=${size}`;
    let data = await customGet(url, {});
    if (!data) return [];
    let ret: FungibleTokenUnspent[] = data.map((v) => ({
      txId: v.txid,
      outputIndex: v.vout,
      tokenAddress: address,
      tokenAmount: v.tokenAmount,
    }));
    return ret;
  }

  /**
   * 查询某人持有的某FT的余额
   */
  public async getFungibleTokenBalance(
    codehash: string,
    genesis: string,
    address: string
  ): Promise<FungibleTokenBalance> {
    let url = `${this.serverBase}/ft/balance/${codehash}/${genesis}/${address}`;
    let data = await customGet(url, {});

    let ret: FungibleTokenBalance = {
      balance: data.balance.toString(),
      pendingBalance: data.pendingBalance.toString(),
      utxoCount: data.utxoCount,
      decimal: data.decimal,
    };

    return ret;
  }

  /**
   * 通过NFT合约CodeHash+溯源genesis获取某地址的utxo列表
   */
  public async getNonFungibleTokenUnspents(
    codehash: string,
    genesis: string,
    address: string,
    cursor: number = 0,
    size: number = 100
  ): Promise<NonFungibleTokenUnspent[]> {
    let url = `${this.serverBase}/nft/utxo/${codehash}/${genesis}/${address}?cursor=${cursor}&size=${size}`;
    let data = await customGet(url, {});

    if (!data) return [];
    let ret: NonFungibleTokenUnspent[] = data.map((v) => ({
      txId: v.txid,
      outputIndex: v.vout,
      tokenAddress: address,
      tokenIndex: v.tokenIndex,
      metaTxId: v.metaTxId,
      metaOutputIndex: v.metaOutputIndex,
    }));
    return ret;
  }

  /**
   * 查询某人持有的某FT的UTXO
   */
  public async getNonFungibleTokenUnspentDetail(
    codehash: string,
    genesis: string,
    tokenIndex: string
  ) {
    let url = `${this.serverBase}/nft/utxo-detail/${codehash}/${genesis}/${tokenIndex}`;
    let data = await customGet(url, {});
    if (!data) return null;
    let ret = [data].map((v) => ({
      txId: v.txid,
      outputIndex: v.vout,
      tokenAddress: v.address,
      tokenIndex: v.tokenIndex,
      metaTxId: v.metaTxId,
      metaOutputIndex: v.metaOutputIndex,
    }))[0];
    return ret;
  }

  /**
   * 查询某人持有的FT Token列表。获得每个token的余额
   */
  public async getFungibleTokenSummary(
    address: string
  ): Promise<FungibleTokenSummary[]> {
    let url = `${this.serverBase}/ft/summary/${address}`;
    let data = await customGet(url, {});
    let ret: FungibleTokenSummary[] = [];
    data.forEach((v) => {
      ret.push({
        codehash: v.codehash,
        genesis: v.genesis,
        sensibleId: v.sensibleId,
        pendingBalance: v.pendingBalance.toString(),
        balance: v.balance.toString(),
        symbol: v.symbol,
        decimal: v.decimal,
      });
    });
    return ret;
  }

  /**
   * 查询某人持有的所有NFT Token列表。获得持有的nft数量计数
   * @param {String} address
   * @returns
   */
  public async getNonFungibleTokenSummary(
    address: string
  ): Promise<NonFungibleTokenSummary[]> {
    let url = `${this.serverBase}/nft/summary/${address}`;
    let data = await customGet(url, {});
    let ret: NonFungibleTokenSummary[] = [];
    data.forEach((v) => {
      ret.push({
        codehash: v.codehash,
        genesis: v.genesis,
        sensibleId: v.sensibleId,
        count: v.count,
        pendingCount: v.pendingCount,
        metaTxId: v.metaTxId,
        metaOutputIndex: v.metaOutputIndex,
        supply: v.supply,
      });
    });
    return ret;
  }

  public async getNftSellUtxo(
    codehash: string,
    genesis: string,
    tokenIndex: string
  ) {
    let url = `${this.serverBase}/nft/sell/utxo-detail/${codehash}/${genesis}/${tokenIndex}?isReadyOnly=true`;
    let data = await customGet(url, {});
    if (!data) return null;
    let ret = data
      .filter((v) => v.isReady == true)
      .map((v) => ({
        codehash,
        genesis,
        tokenIndex,
        txId: v.txid,
        outputIndex: v.vout,
        sellerAddress: v.address,
        satoshisPrice: v.price,
      }))[0];
    return ret;
  }

  public async getNftSellList(
    codehash: string,
    genesis: string,
    cursor: number = 0,
    size: number = 20
  ) {
    let url = `${this.serverBase}/nft/sell/utxo/${codehash}/${genesis}?cursor=${cursor}&size=${size}`;
    let data = await customGet(url, {});
    if (!data) return null;
    let ret = data.map((v) => ({
      codehash,
      genesis,
      tokenIndex: v.tokenIndex,
      txId: v.txid,
      outputIndex: v.vout,
      sellerAddress: v.address,
      satoshisPrice: v.price,
    }));
    return ret;
  }

  public async getNftSellListByAddress(
    address: string,
    cursor: number = 0,
    size: number = 20
  ) {
    let url = `${this.serverBase}/nft/sell/utxo-by-address/${address}?cursor=${cursor}&size=${size}`;
    let data = await customGet(url, {});
    if (!data) return null;
    let ret = data.map((v) => ({
      codehash: v.codehash,
      genesis: v.genesis,
      tokenIndex: v.tokenIndex,
      txId: v.txid,
      outputIndex: v.vout,
      sellerAddress: v.address,
      satoshisPrice: v.price,
    }));
    return ret;
  }

  public async getOutpointSpent(txId: string, index: number) {
    let url = `${this.serverBase}/tx/${txId}/out/${index}/spent`;
    let data = await customGet(url, {});
    if (!data) return null;
    return {
      spentTxId: data.txid,
      spentInputIndex: data.idx,
    };
  }
}
