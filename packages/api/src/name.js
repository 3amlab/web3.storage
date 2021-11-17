import * as uint8arrays from 'uint8arrays'
import * as ipns from 'ipns'
import * as Digest from 'multiformats/hashes/digest'
import { base36 } from 'multiformats/bases/base36'
import { CID } from 'multiformats/cid'
import { keys } from 'libp2p-crypto'
import { HTTPError } from './errors.js'
import { JSONResponse } from './utils/json-response.js'

const libp2pKeyCode = 0x72

/**
 * @param {Request} request
 * @param {import('./env').Env} env
 */
export async function nameGet (request, env) {
  const { params: { key } } = request
  const { code } = CID.parse(key, base36)
  if (code !== libp2pKeyCode) {
    throw new HTTPError(`invalid key code: ${code}`, 400)
  }

  const rawRecord = await env.db.resolveNameRecord(key)
  if (!rawRecord) {
    throw new HTTPError(`record not found for key: ${key}`, 404)
  }

  const { value } = ipns.unmarshal(uint8arrays.fromString(rawRecord, 'base64pad'))

  return new JSONResponse({
    value: uint8arrays.toString(value),
    record: rawRecord
  })
}

/**
 * @param {Request} request
 * @param {import('./env').Env} env
 */
export async function namePost (request, env) {
  const { params: { key } } = request
  const keyCid = CID.parse(key, base36)

  if (keyCid.code !== libp2pKeyCode) {
    throw new HTTPError(`invalid key code: ${keyCid.code}`, 400)
  }

  const rawRecord = await request.text()
  const record = ipns.unmarshal(uint8arrays.fromString(rawRecord, 'base64pad'))
  const pubKey = keys.unmarshalPublicKey(Digest.decode(keyCid.multihash.bytes).bytes)

  if (record.pubKey && !keys.unmarshalPublicKey(record.pubKey).equals(pubKey)) {
    throw new HTTPError('embedded public key mismatch', 400)
  }

  await ipns.validate(pubKey, record)
  await env.db.publishNameRecord(key, rawRecord, record.sequence)

  return new JSONResponse({ id: key }, { status: 202 })
}