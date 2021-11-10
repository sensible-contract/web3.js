export type InputInfo = {
  inputIndex: number;
  scriptHex: string;
  satoshis: number;
  sighashType: number;
  address?: number | string;
};

export type SigResult = {
  sig: string;
  publicKey: string;
};

export * from "./factory";
export * from "./localStorage";
export interface WalletProvider {
  getPublicKey(index?: number): Promise<string>;

  getAddress(index?: number): Promise<string>;

  signTransaction(txHex: string, inputInfos: InputInfo[]): Promise<SigResult[]>;

  /**
   *
   * @param message data to sign
   * @param address address or the index of address
   */
  signMessage(message: string, address?: number | string): Promise<string>;
}
