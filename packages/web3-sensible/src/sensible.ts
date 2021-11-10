import * as bsv from "@sensible-contract/bsv";
import { BN } from "@sensible-contract/bsv";
import { TxComposer } from "@sensible-contract/tx-composer";
import { InputInfo, WalletProvider } from "@sensible-contract/wallet-provider";
import { toDecimalUnit } from "@sensible-contract/web3-utils";
import { SensibleFT, SensibleNFT } from "sensible-sdk-v2";
import { SensibleApiBase } from "sensible-sdk-v2/dist/sensible-api";
const Signature = bsv.crypto.Signature;
export const sighashType = Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
type TokenAmount = {
  amount: string;
  decimal: number;
  uiAmount: string;
};
async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(0);
    }, time * 1000);
  });
}
function toTokenAmount(
  balance: string,
  pendingBalance: string,
  decimal: number
) {
  let bnAmount = BN.fromString(balance, 10).add(
    BN.fromString(pendingBalance, 10)
  );

  let tokenAmount: TokenAmount = {
    amount: bnAmount.toString(10),
    decimal,
    uiAmount: toDecimalUnit(bnAmount.toString(10), decimal),
  };
  return tokenAmount;
}

export class Sensible {
  public provider: WalletProvider;
  private ft: SensibleFT;
  private nft: SensibleNFT;
  public apis: SensibleApiBase;
  constructor(provider: WalletProvider, apis?: SensibleApiBase) {
    this.provider = provider;
    this.apis = apis || (provider as any).apis;

    this.ft = new SensibleFT({});
    // this.ft.sensibleApi = this.apis;
  }

  setProvider(provider: WalletProvider) {
    this.provider = provider;
  }

  async getTokenBalance(codehash: string, genesis: string) {
    let address = await this.provider.getAddress();
    let {
      balance,
      pendingBalance,
      decimal,
      utxoCount,
    } = await this.ft.getBalanceDetail({
      codehash,
      genesis,
      address,
    });
    console.log(utxoCount);

    return toTokenAmount(balance, pendingBalance, decimal);
  }

  async getTokenSummarys() {
    let address = await this.provider.getAddress();
    let _res = await this.ft.getSummary(address);
    return _res.map((v) => {
      return {
        codehash: v.codehash,
        genesis: v.genesis,
        sensibleId: v.sensibleId,
        symbol: v.symbol,
        tokenAmount: toTokenAmount(v.balance, v.pendingBalance, v.decimal),
      };
    });
  }

  private async mergeBsv() {
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
    return {
      utxo: {
        txId: txComposer.getTxId(),
        outputIndex: 0,
        satoshis: txComposer.getOutput(0).satoshis,
        address: address,
      },
      rawTransaction: txComposer.getRawHex(),
    };
  }

  async mergeToken(codehash: string, genesis: string) {
    let address = await this.provider.getAddress();
    let utxos = await this.ft.sensibleApi.getUnspents(address);

    //check bsv utxos count
    if (utxos.length > 3) {
      let _res = await this.mergeBsv();
      utxos = [_res.utxo];
    }

    for (let i = 0; i < 100; i++) {
      let { utxoCount } = await this.ft.getBalanceDetail({
        codehash,
        genesis,
        address,
      });
      if (utxoCount <= 3) break;

      let {
        unsignTxRaw,
        routeCheckTx,
        routeCheckSigHashList,
      } = await this.ft.unsignPreMerge({
        codehash,
        genesis,
        ownerPublicKey: await this.provider.getPublicKey(),
        utxos,
      });
      let inputInfos: InputInfo[] = routeCheckSigHashList.map((v) => {
        return {
          inputIndex: v.inputIndex,
          scriptHex: routeCheckTx.inputs[v.inputIndex].output.script.toHex(),
          satoshis: routeCheckTx.inputs[v.inputIndex].output.satoshis,
          sighashType: v.sighashType,
        };
      });

      let sigResults = await this.provider.signTransaction(
        routeCheckTx.serialize(true),
        inputInfos
      );
      const tx1 = new TxComposer(routeCheckTx);
      tx1.setInputInfos(inputInfos);
      tx1.sign(sigResults);
      let { tx, sigHashList } = await this.ft.unsignMerge(
        routeCheckTx,
        unsignTxRaw
      );
      let inputInfos2: InputInfo[] = sigHashList.map((v) => {
        return {
          inputIndex: v.inputIndex,
          scriptHex: tx.inputs[v.inputIndex].output.script.toHex(),
          satoshis: tx.inputs[v.inputIndex].output.satoshis,
          sighashType: v.sighashType,
        };
      });

      let sigsResults2 = await this.provider.signTransaction(
        tx.serialize(true),
        inputInfos2
      );

      const tx2 = new TxComposer(tx);
      tx2.setInputInfos(inputInfos2);
      tx2.sign(sigsResults2);
      let _res1 = await this.ft.broadcast(tx1.getRawHex());
      console.log("broadcast", _res1);
      let _res2 = await this.ft.broadcast(tx2.getRawHex());
      console.log("broadcast", _res2);
      await sleep(2);
      utxos = [
        {
          txId: tx2.getTxId(),
          outputIndex: 1,
          satoshis: tx2.getOutput(1).satoshis,
          address,
        },
      ];
    }

    return {
      utxos,
    };
  }

  async transferToken(
    codehash: string,
    genesis: string,
    receivers: {
      address: string;
      amount: string;
    }[]
  ) {
    let { utxos } = await this.mergeToken(codehash, genesis);

    let {
      unsignTxRaw,
      routeCheckTx,
      routeCheckSigHashList,
    } = await this.ft.unsignPreTransfer({
      codehash,
      genesis,
      receivers,
      senderPublicKey: await this.provider.getPublicKey(),
      utxos,
    });
    let inputInfos: InputInfo[] = routeCheckSigHashList.map((v) => {
      return {
        inputIndex: v.inputIndex,
        scriptHex: routeCheckTx.inputs[v.inputIndex].output.script.toHex(),
        satoshis: routeCheckTx.inputs[v.inputIndex].output.satoshis,
        sighashType: v.sighashType,
      };
    });

    let sigResults = await this.provider.signTransaction(
      routeCheckTx.serialize(true),
      inputInfos
    );
    const tx1 = new TxComposer(routeCheckTx);
    tx1.setInputInfos(inputInfos);
    tx1.sign(sigResults);
    let { tx, sigHashList } = await this.ft.unsignTransfer(
      routeCheckTx,
      unsignTxRaw
    );
    let inputInfos2: InputInfo[] = sigHashList.map((v) => {
      return {
        inputIndex: v.inputIndex,
        scriptHex: tx.inputs[v.inputIndex].output.script.toHex(),
        satoshis: tx.inputs[v.inputIndex].output.satoshis,
        sighashType: v.sighashType,
      };
    });

    let sigResults2 = await this.provider.signTransaction(
      tx.serialize(true),
      inputInfos2
    );

    const tx2 = new TxComposer(tx);
    tx2.setInputInfos(inputInfos2);
    tx2.sign(sigResults2);
    let _res1 = await this.ft.broadcast(tx1.getRawHex());

    let _res2 = await this.ft.broadcast(tx2.getRawHex());
    return tx2.getTxId();
  }
}
