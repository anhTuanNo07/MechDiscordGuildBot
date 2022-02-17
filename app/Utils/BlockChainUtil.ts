import { EIP712Sig } from './../../types/utils'
import Env from '@ioc:Adonis/Core/Env'
import { ethers, utils } from 'ethers'
import { MechGuild } from 'Types/MechGuild'
import MechGuildAbi from 'Abis/MechGuild.json'
import { fromRpcSig } from 'ethereumjs-util'
import { BigNumberish } from 'ethers'

export const readOnlyProvider = new ethers.providers.JsonRpcProvider(Env.get('NETWORK_URL'))

export const signer = new ethers.Wallet(Env.get('SIGNER_PRIVATE_KEY')).connect(readOnlyProvider)

export const getMechGuildContract = (): MechGuild =>
  new ethers.Contract(Env.get('MECH_GUILD_CONTRACT'), MechGuildAbi, readOnlyProvider) as MechGuild

// verify signature
export function verifyLinkDiscordWalletSign({ sig, wallet, discordId, signer }: any): boolean {
  const types = {
    LinkDiscordWallet: [
      { name: 'wallet', type: 'address' },
      { name: 'discordId', type: 'uint256' },
    ],
  }

  const message = {
    wallet,
    discordId,
  }

  return verifySign({ types, message, sig, signer })
}

export function verifyCreateGuildSign({ sig, isPrivate, nonce, deadline, signer }: any): boolean {
  const types = {
    CreateGuildWithSig: [
      { name: 'isPrivate', type: 'bool' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  }

  const message = {
    isPrivate,
    nonce,
    deadline,
  }

  return verifySign({ types, message, sig, signer })
}

export function verifyJoinGuildSign({ sig, guildId, nonce, deadline, signer }: any): boolean {
  const types = {
    JoinGuildWithSig: [
      { name: 'guildId', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  }

  const message = {
    guildId,
    nonce,
    deadline,
  }

  return verifySign({ types, message, sig, signer })
}

function verifySign({ types, message, sig, signer }: any): boolean {
  const domain = {
    name: 'MechaGuild',
    version: '1',
    verifyingContract: Env.get('MECH_GUILD_CONTRACT'),
  }

  try {
    const recoveredAddress = utils.verifyTypedData(domain, types, message, sig)
    return utils.getAddress(recoveredAddress) === utils.getAddress(signer)
  } catch (e) {
    return false
  }
}

export async function getNonce(creator: string): Promise<string> {
  const guild = getMechGuildContract()
  return await (await guild.createGuildSigNonces(creator)).toString()
}

// create signature
export function signCreateGuild(creator: string, isPrivate: boolean, backend: any) {
  return new Promise<EIP712Sig>(async (res, reject) => {
    let nonce
    const guild = getMechGuildContract()
    // const guild = await guildContract.connect(backend)

    try {
      nonce = (await guild.createGuildSigNonces(creator)).toNumber()
    } catch (e) {
      console.error('NONCE', e)
      reject(e)
      return
    }

    const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 // 24 hours

    try {
      const types = {
        CreateGuildWithSig: [
          { name: 'isPrivate', type: 'bool' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      }

      const message = {
        isPrivate,
        nonce,
        deadline,
      }

      const domain = {
        name: 'MechaGuild',
        version: '1',
        verifyingContract: guild.address,
      }

      const sig = await backend._signTypedData(domain, types, message)

      const response = fromRpcSig(sig)
      res({
        r: response.r,
        s: response.s,
        v: response.v,
        deadline: deadline.toString(),
      })
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

export async function signJoinGuild(guildId: BigNumberish, member: string, backend: any) {
  return new Promise<EIP712Sig>(async (res, reject) => {
    let nonce
    const guild = getMechGuildContract()

    try {
      nonce = (await guild.joinGuildSigNonces(member)).toNumber()
    } catch (e) {
      console.error('NONCE', e)
      reject(e)
      return
    }

    const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 // 24 hours

    try {
      const types = {
        JoinGuildWithSig: [
          { name: 'guildId', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      }

      const message = {
        guildId,
        nonce,
        deadline,
      }

      const domain = {
        name: 'MechaGuild',
        version: '1',
        verifyingContract: guild.address,
      }

      const sig = await backend._signTypedData(domain, types, message)

      const response = fromRpcSig(sig)
      res({
        r: response.r,
        s: response.s,
        v: response.v,
        deadline: deadline.toString(),
      })
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}
