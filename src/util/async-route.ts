import express from 'express'

export function asyncRoute(handler: express.Handler) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // returns to make testing more straightforward. the output is not actually needed.
    return Promise.resolve(handler(req, res, next)).catch(next)
  }
}
