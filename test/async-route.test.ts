import { asyncRoute } from '../src/util/async-route'
import { Request, Response } from 'express'

describe('async-route', () => {
  it('calls next with error if handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('test'))
    const route = asyncRoute(handler)
    const next = jest.fn()
    await route({} as Request, {} as Response, next)
    expect(next).toHaveBeenCalled()
  })
  it('avoids calling next if handler does not throw', async () => {
    const handler = jest.fn().mockResolvedValue(undefined)
    const route = asyncRoute(handler)
    const next = jest.fn()
    await route({} as Request, {} as Response, next)
    expect(next).not.toHaveBeenCalled()
  })
})
