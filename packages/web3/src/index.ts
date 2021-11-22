import { WalletProvider } from "@sensible-contract/wallet-provider";
import { GetDefaultApis, SensibleApi } from "@sensible-contract/web3-apis";
import { Sensible } from "@sensible-contract/web3-sensible";
import * as utils from "@sensible-contract/web3-utils";
import { Wallet } from "@sensible-contract/web3-wallet";
var version = require("../package.json").version;

export class Web3 {
  provider: WalletProvider;
  api: SensibleApi;

  wallet: Wallet;
  sensible: Sensible;
  utils = utils;
  version = version;

  static modules: Modules;
  static readonly utils = utils;
  static readonly version: string = version;

  constructor(provider: WalletProvider, apis?: any) {
    this.provider = provider;
    apis = apis || (provider as any).apis || GetDefaultApis();
    this.wallet = new Wallet(provider, apis);
    this.sensible = new Sensible(provider, apis);
  }

  setProvider(provider: WalletProvider) {
    this.provider = provider;
    this.wallet.setProvider(provider);
    this.sensible.setProvider(provider);
  }
}

export interface Modules {
  Wallet: new (provider: WalletProvider, apis?: SensibleApi) => Wallet;
  Sensible: new (provider: WalletProvider) => Sensible;
}
module.exports = Web3;
