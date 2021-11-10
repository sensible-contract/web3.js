import * as bsv from "@sensible-contract/bsv";
import { InputInfo } from "@sensible-contract/wallet-provider";
import * as nftProto from "./sensible/bcp01/contract-proto/nft.proto";
import * as nftSellProto from "./sensible/bcp01/contract-proto/nftSell.proto";
import * as tokenProto from "./sensible/bcp02/contract-proto/token.proto";
import * as proto from "./sensible/protoheader";

export enum OutputType {
  P2PKH,
  SENSIBLE_NFT,
  SENSIBLE_NFT_GENESIS,
  SENSIBLE_NFT_SELL,
  SENSIBLE_NFT_UNLOCK_CONTRACT_CHECK,
  SENSIBLE_TOKEN,
  SENSIBLE_TOKEN_GENESIS,
  SENSIBLE_TOKEN_TRANSFER_CHECK,
  SENSIBLE_TOKEN_UNLOCK_CONTRACT_CHECK,
  OP_RETURN,
  UNKNOWN,
}

export type DecodedOutput = {
  type: OutputType;
  satoshis: number;
  data?: any;
  address?: string;
};

export class TxDecoder {
  static decodeOutput(
    output: bsv.Transaction.Output,
    network: bsv.Networks.Type = "mainnet"
  ): DecodedOutput {
    let scriptBuf = output.script.toBuffer();
    if (proto.hasProtoFlag(scriptBuf)) {
      //SENSIBLE
      let protoType = proto.getProtoType(scriptBuf);
      if (protoType == proto.PROTO_TYPE.NFT) {
        return {
          type: OutputType.SENSIBLE_NFT,
          satoshis: output.satoshis,
          data: nftProto.parseScript(scriptBuf, network),
        };
      } else if (protoType == proto.PROTO_TYPE.FT) {
        return {
          type: OutputType.SENSIBLE_TOKEN,
          satoshis: output.satoshis,
          data: tokenProto.parseScript(scriptBuf, network),
        };
      } else if (protoType == proto.PROTO_TYPE.NFT_SELL) {
        return {
          type: OutputType.SENSIBLE_NFT_SELL,
          satoshis: output.satoshis,
          data: nftSellProto.parseScript(scriptBuf),
        };
      } else {
        return {
          type: OutputType.UNKNOWN,
          satoshis: output.satoshis,
        };
      }
    } else if (output.script.isPublicKeyHashOut()) {
      return {
        type: OutputType.P2PKH,
        satoshis: output.satoshis,
        address: output.script.toAddress(network).toString(),
      };
    } else if (output.script.isSafeDataOut()) {
      return {
        type: OutputType.OP_RETURN,
        satoshis: 0,
      };
    } else {
      return {
        type: OutputType.UNKNOWN,
        satoshis: output.satoshis,
      };
    }
  }

  static decodeTx(
    rawTransaction: string,
    inputInfos: InputInfo[],
    network: bsv.Networks.Type = "mainnet"
  ) {
    let tx = new bsv.Transaction(rawTransaction);

    let inputs: DecodedOutput[] = [];
    tx.inputs.forEach((v) => {
      if (v.output) {
        inputs.push(this.decodeOutput(v.output, network));
      }
    });

    let outputs: DecodedOutput[] = [];
    tx.outputs.forEach((v) => {
      outputs.push(this.decodeOutput(v, network));
    });

    let fee =
      inputs.reduce((pre, cur) => pre + cur.satoshis, 0) -
      outputs.reduce((pre, cur) => pre + cur.satoshis, 0);
    return {
      txId: tx.id,
      inputs,
      outputs,
      fee,
    };
  }
}
