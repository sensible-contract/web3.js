import * as TokenUtil from "./tokenUtil";

function toHex(buffer: any) {
  return buffer.toString("hex");
}
export function getVarPushdataHeader(n: number): Buffer {
  let header = "";
  if (n == 0) {
  } else if (n == 1) {
    //不处理这种情况，这里只考虑长脚本
  } else if (n < 76) {
    // Use direct push
    header = toHex(TokenUtil.getUInt8Buf(n));
  } else if (n <= 255) {
    header = "4c" + toHex(TokenUtil.getUInt8Buf(n));
  } else if (n <= 65535) {
    header = "4d" + toHex(TokenUtil.getUInt16Buf(n));
  } else {
    header = "4e" + toHex(TokenUtil.getUInt32Buf(n));
  }
  return Buffer.from(header, "hex");
}
