import * as bsv from "@sensible-contract/bsv";
import { BN } from "@sensible-contract/bsv";
import { InputInfo, SigResult } from "@sensible-contract/wallet-provider";
const { Script } = bsv;
const { Interpreter } = Script;
const Interp = Interpreter;

const flags =
  Interp.SCRIPT_ENABLE_MAGNETIC_OPCODES |
  Interp.SCRIPT_ENABLE_MONOLITH_OPCODES | // TODO: to be removed after upgrade to bsv 2.0
  Interp.SCRIPT_VERIFY_STRICTENC |
  Interp.SCRIPT_ENABLE_SIGHASH_FORKID |
  Interp.SCRIPT_VERIFY_LOW_S |
  Interp.SCRIPT_VERIFY_NULLFAIL |
  Interp.SCRIPT_VERIFY_DERSIG |
  Interp.SCRIPT_VERIFY_MINIMALDATA |
  Interp.SCRIPT_VERIFY_NULLDUMMY |
  Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS |
  Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY |
  Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY;
const Signature = bsv.crypto.Signature;
export const DEFAULT_SIGHASH_TYPE =
  Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
const P2PKH_UNLOCK_SIZE = 1 + 1 + 71 + 1 + 33;
const P2PKH_DUST_AMOUNT = 135;
export const PLACE_HOLDER_SIG =
  "41682c2074686973206973206120706c61636520686f6c64657220616e642077696c6c206265207265706c6163656420696e207468652066696e616c207369676e61747572652e00";
export const PLACE_HOLDER_PUBKEY =
  "41682c2074686973206973206120706c61636520686f6c64657220616e64207769";

export function numberToBuffer(n: number) {
  let str = n.toString(16);
  if (str.length % 2 == 1) {
    str = "0" + str;
  }
  return Buffer.from(str, "hex");
}
export class TxComposer {
  private tx: bsv.Transaction;
  private inputInfos: InputInfo[] = [];
  changeOutputIndex: number = -1;
  constructor(tx?: bsv.Transaction) {
    this.tx = tx || new bsv.Transaction();
  }

  getRawHex() {
    return this.tx.serialize(true);
  }

  getTx() {
    return this.tx;
  }
  getTxId() {
    return this.tx.id;
  }

  getInput(inputIndex: number) {
    return this.tx.inputs[inputIndex];
  }

  getOutput(outputIndex: number) {
    return this.tx.outputs[outputIndex];
  }

  appendP2PKHInput(utxo: {
    address: bsv.Address;
    satoshis: number;
    txId: string;
    outputIndex: number;
  }) {
    this.tx.addInput(
      new bsv.Transaction.Input.PublicKeyHash({
        output: new bsv.Transaction.Output({
          script: bsv.Script.buildPublicKeyHashOut(utxo.address),
          satoshis: utxo.satoshis,
        }),
        prevTxId: utxo.txId,
        outputIndex: utxo.outputIndex,
        script: bsv.Script.empty(),
      })
    );
    const inputIndex = this.tx.inputs.length - 1;
    return inputIndex;
  }

  appendInput(input: {
    txId: string;
    outputIndex: number;
    lockingScript?: bsv.Script;
    satoshis?: number;
  }) {
    this.tx.addInput(
      new bsv.Transaction.Input({
        output: new bsv.Transaction.Output({
          script: input.lockingScript,
          satoshis: input.satoshis,
        }),
        prevTxId: input.txId,
        outputIndex: input.outputIndex,
        script: bsv.Script.empty(),
      })
    );
    const inputIndex = this.tx.inputs.length - 1;
    return inputIndex;
  }

  appendP2PKHOutput(output: { address: bsv.Address; satoshis: number }) {
    this.tx.addOutput(
      new bsv.Transaction.Output({
        script: new bsv.Script(output.address),
        satoshis: output.satoshis,
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  appendOutput(output: { lockingScript: bsv.Script; satoshis: number }) {
    this.tx.addOutput(
      new bsv.Transaction.Output({
        script: output.lockingScript,
        satoshis: output.satoshis,
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  appendOpReturnOutput(opreturnData: any) {
    this.tx.addOutput(
      new bsv.Transaction.Output({
        script: bsv.Script.buildSafeDataOut(opreturnData),
        satoshis: 0,
      })
    );
    const outputIndex = this.tx.outputs.length - 1;
    return outputIndex;
  }

  clearChangeOutput() {
    if (this.changeOutputIndex != -1) {
      this.tx.outputs.splice(this.changeOutputIndex, 1);
      this.changeOutputIndex = 0;
    }
  }
  appendChangeOutput(changeAddress: bsv.Address, feeb = 0.5, extraSize = 0) {
    //Calculate the fee and determine whether to change
    //If there is change, it will be output in the last item
    const unlockSize =
      this.tx.inputs.filter((v) => v.output.script.isPublicKeyHashOut())
        .length * P2PKH_UNLOCK_SIZE;
    let fee = Math.ceil(
      (this.tx.toBuffer().length +
        unlockSize +
        extraSize +
        bsv.Transaction.CHANGE_OUTPUT_MAX_SIZE) *
        feeb
    );

    let changeAmount = this.getUnspentValue() - fee;
    if (changeAmount >= P2PKH_DUST_AMOUNT) {
      this.changeOutputIndex = this.appendP2PKHOutput({
        address: changeAddress,
        satoshis: changeAmount,
      });
    } else {
      this.changeOutputIndex = -1;
    }
    return this.changeOutputIndex;
  }

  unlockP2PKHInput(
    privateKey: bsv.PrivateKey,
    inputIndex: number,
    sighashType = DEFAULT_SIGHASH_TYPE
  ) {
    const tx = this.tx;
    const sig = new bsv.Transaction.Signature({
      publicKey: privateKey.publicKey,
      prevTxId: tx.inputs[inputIndex].prevTxId,
      outputIndex: tx.inputs[inputIndex].outputIndex,
      inputIndex,
      signature: bsv.Transaction.Sighash.sign(
        tx,
        privateKey,
        sighashType,
        inputIndex,
        tx.inputs[inputIndex].output.script,
        tx.inputs[inputIndex].output.satoshisBN
      ),
      sigtype: sighashType,
    });

    tx.inputs[inputIndex].setScript(
      bsv.Script.buildPublicKeyHashIn(
        sig.publicKey,
        sig.signature.toDER(),
        sig.sigtype
      )
    );
  }

  getTxFormatSig(
    privateKey: bsv.PrivateKey,
    inputIndex: number,
    sighashType = DEFAULT_SIGHASH_TYPE
  ) {
    return bsv.Transaction.Sighash.sign(
      this.tx,
      privateKey,
      sighashType,
      inputIndex,
      this.getInput(inputIndex).output.script,
      new BN(this.getInput(inputIndex).output.satoshis),
      flags
    )
      .toTxFormat()
      .toString("hex");
  }

  getPreimage(inputIndex: number, sighashType = DEFAULT_SIGHASH_TYPE) {
    return bsv.Transaction.Sighash.sighashPreimage(
      this.tx,
      sighashType,
      inputIndex,
      this.getInput(inputIndex).output.script,
      new BN(this.getInput(inputIndex).output.satoshis),
      flags
    ).toString("hex");
  }

  getUnspentValue() {
    const inputAmount = this.tx.inputs.reduce(
      (pre, cur) => cur.output.satoshis + pre,
      0
    );
    const outputAmount = this.tx.outputs.reduce(
      (pre, cur) => cur.satoshis + pre,
      0
    );

    let unspentAmount = inputAmount - outputAmount;
    return unspentAmount;
  }

  getFeeRate() {
    let unspent = this.getUnspentValue();
    let txSize = this.tx.toBuffer().length;
    return unspent / txSize;
  }

  getInputInfos() {
    return this.inputInfos;
  }

  setInputInfos(inputInfos: InputInfo[]) {
    this.inputInfos = inputInfos;
  }

  addInputInfo({
    inputIndex,
    sighashType,
    address,
  }: {
    inputIndex: number;
    sighashType: number;
    address?: number | string;
  }) {
    this.inputInfos.push({
      inputIndex,
      scriptHex: this.getInput(inputIndex).output.script.toHex(),
      satoshis: this.getInput(inputIndex).output.satoshis,
      sighashType,
      address,
    });
  }

  getPrevoutsHash() {
    let prevouts = Buffer.alloc(0);
    this.tx.inputs.forEach((input) => {
      const indexBuf = Buffer.alloc(4, 0);
      indexBuf.writeUInt32LE(input.outputIndex);
      prevouts = Buffer.concat([
        prevouts,
        Buffer.from(input.prevTxId).reverse(),
        indexBuf,
      ]);
    });
    return bsv.crypto.Hash.sha256sha256(prevouts).toString("hex");
  }

  sign(sigResults: SigResult[]) {
    this.inputInfos.forEach((v, index) => {
      let sigResult = sigResults[index];
      let publicKey = bsv.PublicKey.fromString(sigResult.publicKey);
      let _sig = bsv.crypto.Signature.fromString(sigResults[index].sig);
      _sig.nhashtype = v.sighashType;
      let input = this.tx.inputs[v.inputIndex];
      if (input.script.toHex()) {
        let _sig2 = _sig.toTxFormat();
        let oldSigHex = Buffer.concat([
          numberToBuffer(PLACE_HOLDER_SIG.length / 2),
          Buffer.from(PLACE_HOLDER_SIG, "hex"),
        ]).toString("hex");

        let newSigHex = Buffer.concat([
          numberToBuffer(_sig2.length),
          _sig2,
        ]).toString("hex");

        let oldPubKeyHex = Buffer.concat([
          numberToBuffer(PLACE_HOLDER_PUBKEY.length / 2),
          Buffer.from(PLACE_HOLDER_PUBKEY, "hex"),
        ]).toString("hex");

        const pubkeyBuffer = publicKey.toBuffer();
        let newPubKeyHex = Buffer.concat([
          numberToBuffer(pubkeyBuffer.length),
          pubkeyBuffer,
        ]).toString("hex");

        input.setScript(
          new bsv.Script(
            input.script
              .toHex()
              .replace(oldSigHex, newSigHex)
              .replace(oldPubKeyHex, newPubKeyHex)
          )
        );
      } else {
        const signature = new bsv.Transaction.Signature({
          publicKey,
          prevTxId: input.prevTxId,
          outputIndex: input.outputIndex,
          inputIndex: v.inputIndex,
          signature: _sig,
          sigtype: v.sighashType,
        });
        input.setScript(
          bsv.Script.buildPublicKeyHashIn(
            signature.publicKey,
            signature.signature.toDER(),
            signature.sigtype
          )
        );
      }
    });
  }
}
