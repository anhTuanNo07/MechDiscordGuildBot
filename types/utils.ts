import { BigNumberish } from 'ethers'

export type EIP712Sig = {
  deadline: BigNumberish
  v: any
  r: any
  s: any
}
