import Env from '@ioc:Adonis/Core/Env'
import { ethers, BigNumberish, utils } from 'ethers'
import { MechGuild } from 'Types/MechGuild'
import MechGuildAbi from 'Abis/MechGuild.json'

export const readOnlyProvider = new ethers.providers.JsonRpcProvider(Env.get('NETWORK_URL'))

export const getMechaGuildContract = (): MechGuild =>
  new ethers.Contract(Env.get('MECH_GUILD_CONTRACT'), MechGuildAbi, readOnlyProvider) as MechGuild

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
