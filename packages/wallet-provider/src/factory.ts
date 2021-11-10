import { LocalStorageHDWalletProvider } from ".";
import { LocalStorageWalletProvider } from "./localStorage";
export enum WALLET_PROVIDER_TYPE {
  LOCAL_SINGLE,
  LOCAL_HD,
}
export class WalletProviderFactory {
  static getProvider(type: WALLET_PROVIDER_TYPE, args: any) {
    if (type === WALLET_PROVIDER_TYPE.LOCAL_SINGLE) {
      return new LocalStorageWalletProvider(args);
    } else if (type == WALLET_PROVIDER_TYPE.LOCAL_HD) {
      return new LocalStorageHDWalletProvider(args);
    }
  }
}
