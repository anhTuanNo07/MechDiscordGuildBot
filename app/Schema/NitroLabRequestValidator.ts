import { schema } from '@ioc:Adonis/Core/Validator'

const craftNitro = {
  account: schema.string(),
}

const signNitro = {
  account: schema.string(),
  challenge: schema.number(),
}

export const signNitroValidator = schema.create(signNitro)

export const craftNitroValidator = schema.create(craftNitro)
