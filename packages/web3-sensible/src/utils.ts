export enum TOKEN_TRANSFER_TYPE {
  IN_3_OUT_3 = 1,
  IN_6_OUT_6,
  IN_10_OUT_10,
  IN_20_OUT_3,
  IN_3_OUT_100,
  UNSUPPORT,
}

let tokenTransferTypeInfos = [
  {
    type: TOKEN_TRANSFER_TYPE.IN_3_OUT_3,
    in: 3,
    out: 3,
    lockingScriptSize: 0,
  },
  {
    type: TOKEN_TRANSFER_TYPE.IN_6_OUT_6,
    in: 6,
    out: 6,
    lockingScriptSize: 0,
  },
  {
    type: TOKEN_TRANSFER_TYPE.IN_10_OUT_10,
    in: 10,
    out: 10,
    lockingScriptSize: 0,
  },
  {
    type: TOKEN_TRANSFER_TYPE.IN_20_OUT_3,
    in: 20,
    out: 3,
    lockingScriptSize: 0,
  },
  {
    type: TOKEN_TRANSFER_TYPE.IN_3_OUT_100,
    in: 3,
    out: 100,
    lockingScriptSize: 0,
  },
];

function getOptimumType(inCount: number, outCount: number) {
  let typeInfo = tokenTransferTypeInfos.find(
    (v) => inCount <= v.in && outCount <= v.out
  );
  if (!typeInfo) {
    return TOKEN_TRANSFER_TYPE.UNSUPPORT;
  }
  return typeInfo.type;
}
