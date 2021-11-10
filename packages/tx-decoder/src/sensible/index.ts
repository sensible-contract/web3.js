import * as bsv from "@sensible-contract/bsv";
import { BN } from "@sensible-contract/bsv";
import * as nftProto from "./bcp01/contract-proto/nft.proto";
import * as ftProto from "./bcp02/contract-proto/token.proto";
import { hasProtoFlag } from "./protoheader";
export function parseNFTScript(
  scriptBuf: Buffer,
  network: bsv.Networks.Type = "mainnet"
): {
  codehash: string;
  genesis: string;
  sensibleId: string;
  metaidOutpoint: nftProto.MetaidOutpoint;
  genesisFlag: number;

  nftAddress: string;
  totalSupply: BN;
  tokenIndex: BN;
  genesisHash: string;
  rabinPubKeyHashArrayHash: string;
  sensibleID: nftProto.SensibleID;
  protoVersion: number;
  protoType: number;
} {
  if (!hasProtoFlag(scriptBuf)) {
    return null;
  }
  const dataPart = nftProto.parseDataPart(scriptBuf);
  const nftAddress = bsv.Address.fromPublicKeyHash(
    Buffer.from(dataPart.nftAddress, "hex"),
    network
  ).toString();
  const genesis = nftProto.getQueryGenesis(scriptBuf);
  const codehash = nftProto.getQueryCodehash(scriptBuf);
  const sensibleId = nftProto.getQuerySensibleID(scriptBuf);
  return {
    codehash,
    genesis,
    sensibleId,
    metaidOutpoint: dataPart.metaidOutpoint,
    genesisFlag: dataPart.genesisFlag,
    nftAddress,
    totalSupply: dataPart.totalSupply,
    tokenIndex: dataPart.tokenIndex,
    genesisHash: dataPart.genesisHash,
    rabinPubKeyHashArrayHash: dataPart.rabinPubKeyHashArrayHash,
    sensibleID: dataPart.sensibleID,
    protoVersion: dataPart.protoVersion,
    protoType: dataPart.protoType,
  };
}

export function parseTokenScript(
  scriptBuf: Buffer,
  network: bsv.Networks.Type = "mainnet"
): {
  codehash: string;
  genesis: string;
  sensibleId: string;
  tokenName: string;
  tokenSymbol: string;
  genesisFlag: number;
  decimalNum: number;
  tokenAddress: string;
  tokenAmount: BN;
  genesisHash: string;
  rabinPubKeyHashArrayHash: string;
  sensibleID: ftProto.SensibleID;
  protoVersion: number;
  protoType: number;
} {
  if (!hasProtoFlag(scriptBuf)) {
    return null;
  }
  const dataPart = ftProto.parseDataPart(scriptBuf);
  const tokenAddress = bsv.Address.fromPublicKeyHash(
    Buffer.from(dataPart.tokenAddress, "hex"),
    network
  ).toString();
  const genesis = ftProto.getQueryGenesis(scriptBuf);
  const codehash = ftProto.getQueryCodehash(scriptBuf);
  const sensibleId = ftProto.getQuerySensibleID(scriptBuf);
  return {
    codehash,
    genesis,
    sensibleId,
    tokenName: dataPart.tokenName,
    tokenSymbol: dataPart.tokenSymbol,
    genesisFlag: dataPart.genesisFlag,
    decimalNum: dataPart.decimalNum,
    tokenAddress,
    tokenAmount: dataPart.tokenAmount,
    genesisHash: dataPart.genesisHash,
    rabinPubKeyHashArrayHash: dataPart.rabinPubKeyHashArrayHash,
    sensibleID: dataPart.sensibleID,
    protoVersion: dataPart.protoVersion,
    protoType: dataPart.protoType,
  };
}
