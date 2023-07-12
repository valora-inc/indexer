import express from 'express'

export function asyncRoute(handler: express.Handler) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
