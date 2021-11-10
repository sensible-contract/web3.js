import * as bsv from "@sensible-contract/bsv";
import { TxComposer } from "@sensible-contract/tx-composer";
import { InputInfo, WalletProvider } from "@sensible-contract/wallet-provider";
import { SensibleApi } from "@sensible-contract/web3-apis";
const Signature = bsv.crypto.Signature;
export const sighashType = Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
const P2PKH_UNLOCK_SIZE = 1 + 1 + 71 + 1 + 33;
const P2PKH_DUST_AMOUNT = 135;
export class Wallet {
  public provider: WalletProvider;
  public apis: SensibleApi;
  constructor(provider: WalletProvider, apis?: SensibleApi) {
    this.provider = provider;
    this.apis = apis || (provider as any).apis;
  }

  setProvider(provider: WalletProvider) {
    this.provider = provider;
  }

  async getBalance() {
    let address = await this.provider.getAddress();
    let balance = await this.apis.getBalance(address);
    return balance;
  }

  async signTransaction(txHex: string, inputInfos: InputInfo[]) {
    const tx = new bsv.Transaction(txHex);
    const txComposer = new TxComposer(tx);
    let sigResults = await this.provider.signTransaction(txHex, inputInfos);
    txComposer.sign(sigResults);
    return {
      txhex: txComposer.getRawHex(),
      txid: txComposer.getTxId(),
    };
  }

  async signMessage(message: string) {
    return this.provider.signMessage(message);
  }

  onAccountChange() {}

  async transferBsv(to: string, amount: number) {
    const txComposer = new TxComposer();
    let address = await this.provider.getAddress();
    let utxos = await this.apis.getUnspents(address);
    utxos.forEach((v, index) => {
      txComposer.appendP2PKHInput({
        address: new bsv.Address(v.address),
        txId: v.txId,
        outputIndex: v.outputIndex,
        satoshis: v.satoshis,
      });
      txComposer.addInputInfo({
        inputIndex: index,
        sighashType,
      });
    });
    txComposer.appendP2PKHOutput({
      address: new bsv.Address(to),
      satoshis: amount,
    });
    txComposer.appendChangeOutput(new bsv.Address(address));
    let sigResults = await this.provider.signTransaction(
      txComposer.getRawHex(),
      txComposer.getInputInfos()
    );
    txComposer.sign(sigResults);

    await this.apis.broadcast(txComposer.getRawHex());
    return txComposer.getTxId();
  }

  async transferBsvArray(arr: { to: string; amount: number }[]) {
    const txComposer = new TxComposer();
    let address = await this.provider.getAddress();
    let utxos = await this.apis.getUnspents(address);
    utxos.forEach((v, index) => {
      txComposer.appendP2PKHInput({
        address: new bsv.Address(v.address),
        txId: v.txId,
        outputIndex: v.outputIndex,
        satoshis: v.satoshis,
      });
      txComposer.addInputInfo({
        inputIndex: index,
        sighashType,
      });
    });
    arr.forEach((v) => {
      txComposer.appendP2PKHOutput({
        address: new bsv.Address(v.to),
        satoshis: v.amount,
      });
    });

    txComposer.appendChangeOutput(new bsv.Address(address));
    let sigResults = await this.provider.signTransaction(
      txComposer.getRawHex(),
      txComposer.getInputInfos()
    );
    txComposer.sign(sigResults);

    await this.apis.broadcast(txComposer.getRawHex());
    return txComposer.getTxId();
  }

  async transferAllBsv(to: string) {
    const feeb = 0.5;
    const txComposer = new TxComposer();
    let address = await this.provider.getAddress();
    let utxos = await this.apis.getUnspents(address);
    let amount = 0;
    utxos.forEach((v, index) => {
      txComposer.appendP2PKHInput({
        address: new bsv.Address(v.address),
        txId: v.txId,
        outputIndex: v.outputIndex,
        satoshis: v.satoshis,
      });
      txComposer.addInputInfo({
        inputIndex: index,
        sighashType,
      });
      amount += v.satoshis;
    });
    let outputIndex = txComposer.appendP2PKHOutput({
      address: new bsv.Address(to),
      satoshis: amount,
    });

    const unlockSize = txComposer.getTx().inputs.length * P2PKH_UNLOCK_SIZE;
    let fee = Math.ceil(
      (txComposer.getTx().toBuffer().length + unlockSize) * feeb
    );
    txComposer.getOutput(outputIndex).satoshis -= fee;

    let sigResults = await this.provider.signTransaction(
      txComposer.getRawHex(),
      txComposer.getInputInfos()
    );
    txComposer.sign(sigResults);

    await this.apis.broadcast(txComposer.getRawHex());
    return txComposer.getTxId();
  }

  async mergeBsv() {
    const txComposer = new TxComposer();
    let address = await this.provider.getAddress();
    let utxos = await this.apis.getUnspents(address);
    utxos.forEach((v, index) => {
      txComposer.appendP2PKHInput({
        address: new bsv.Address(v.address),
        txId: v.txId,
        outputIndex: v.outputIndex,
        satoshis: v.satoshis,
      });
      txComposer.addInputInfo({
        inputIndex: index,
        sighashType,
      });
    });
    txComposer.appendChangeOutput(new bsv.Address(address));
    let sigResults = await this.provider.signTransaction(
      txComposer.getRawHex(),
      txComposer.getInputInfos()
    );
    txComposer.sign(sigResults);

    await this.apis.broadcast(txComposer.getRawHex());
    return txComposer.getTxId();
  }
}
