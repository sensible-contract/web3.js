import * as bsv from "@sensible-contract/bsv";
import { InputInfo, WalletProvider } from "./index";

export function generatePrivKeyFromMnemonic(
  mnemonic: string,
  derivationPath: string = "m/44'/0'/0'",
  passphrase: string = "",
  network: bsv.Networks.Type = "livenet",
  addressIndex: number = 0,
  change: number = 0
) {
  let mne = new bsv.Mnemonic(mnemonic);
  let xprivkey = mne
    .toHDPrivateKey(passphrase, network)
    .deriveChild(derivationPath);
  let privateKey = xprivkey.deriveChild(`m/${change}/${addressIndex}`)
    .privateKey;
  return privateKey;
}

export class LocalStorageWalletProvider implements WalletProvider {
  privateKey: bsv.PrivateKey;
  network: bsv.Networks.Type;
  constructor({ wif, network }: { wif: string; network?: bsv.Networks.Type }) {
    this.privateKey = new bsv.PrivateKey(wif);
    this.network = network;
  }

  init = async () => {
    return this;
  };

  async getPublicKey() {
    return this.privateKey.publicKey.toString();
  }

  async getAddress() {
    return this.privateKey.toAddress(this.network).toString();
  }

  async signTransaction(txHex: string, inputInfos: InputInfo[]) {
    const tx = new bsv.Transaction(txHex);
    let sigResults = inputInfos.map((v) => {
      let sighash = bsv.Transaction.Sighash.sighash(
        tx,
        v.sighashType,
        v.inputIndex,
        new bsv.Script(v.scriptHex),
        new bsv.crypto.BN(v.satoshis)
      ).toString("hex");

      var sig = bsv.crypto.ECDSA.sign(
        Buffer.from(sighash, "hex"),
        this.privateKey,
        "little"
      )
        .set({
          nhashtype: v.sighashType,
        })
        .toString();
      return { sig, publicKey: this.getPublicKey().toString() };
    });
    return sigResults;
  }

  async signMessage(message: string) {
    return bsv.Message.sign(message, this.privateKey);
  }
}

export class LocalStorageHDWalletProvider implements WalletProvider {
  words: string;
  network: bsv.Networks.Type;
  xprivkey: bsv.HDPrivateKey;
  constructor({
    mnemonic,
    derivationPath = "m/44'/0'/0'",
    passphrase = "",
    network,
  }: {
    mnemonic: string;
    derivationPath?: string;
    passphrase?: string;
    network?: bsv.Networks.Type;
  }) {
    let mne = new bsv.Mnemonic(mnemonic);
    this.xprivkey = mne
      .toHDPrivateKey(passphrase, network)
      .deriveChild(derivationPath);

    this.network = network;
  }

  init = async () => {
    return this;
  };

  private getPrivateKey(index: number) {
    return this.xprivkey.deriveChild(`m/0/${index}`).privateKey;
  }

  async getPublicKey(index: number = 0) {
    return this.getPrivateKey(index).toPublicKey().toString();
  }

  async getAddress(index: number = 0) {
    return this.getPrivateKey(index).toAddress(this.network).toString();
  }

  async signTransaction(txHex: string, inputInfos: InputInfo[]) {
    const tx = new bsv.Transaction(txHex);
    let sigResults = inputInfos.map((v) => {
      let privateKey = this.getPrivateKey(v.address as number);

      let sighash = bsv.Transaction.Sighash.sighash(
        tx,
        v.sighashType,
        v.inputIndex,
        new bsv.Script(v.scriptHex),
        new bsv.crypto.BN(v.satoshis)
      ).toString("hex");

      var sig = bsv.crypto.ECDSA.sign(
        Buffer.from(sighash, "hex"),
        privateKey,
        "little"
      )
        .set({
          nhashtype: v.sighashType,
        })
        .toString();
      return { sig, publicKey: privateKey.toPublicKey().toString() };
    });
    return sigResults;
  }

  async signMessage(message: string, address?: string | number) {
    let privateKey: bsv.PrivateKey;
    if (typeof address == "number") {
      privateKey = this.getPrivateKey(address);
    } else {
      //todo
    }
    return bsv.Message.sign(message, privateKey);
  }
}
