import express from 'express'
import { AxiosStatic, AxiosRequestConfig, Method as AxiosMethod } from './axios'
import http from 'http'

declare global {
  const axios: AxiosStatic
  type IncomingHttpHeaders = http.IncomingHttpHeaders
  type HTTPMethods = AxiosMethod
  namespace Axios {
    type data =
      | string
      | FormData
      | {
          [x: string]: string
        }
    interface RequestConfig extends AxiosRequestConfig {
      data: Axios.data
      onUploadProgress?: (progressEvent: Axios.ProgressEvent) => void
      onDownloadProgress?: (progressEvent: Axios.ProgressEvent) => void
    }
    interface EventTarget extends globalThis.EventTarget {
      start: number
      end: number
      responseURL: string
    }
    interface ProgressEvent extends globalThis.ProgressEvent {
      target: Axios.EventTarget
    }
  }
  namespace SocketIOClient {
    interface Emitter {
      removeAllListeners(event?: string | symbol): this;
    }
  }
  namespace SocketIO {
    interface Socket {
      username: string
    }
  }

  namespace Express {
    namespace Multer {
      interface File {
        data: string
      }
    }
    interface ErrorRequestHandler extends express.ErrorRequestHandler {}
    interface RequestHandler extends express.RequestHandler {}
    interface Request {
      method: HTTPMethods
    }
    interface Response {}
  }

  namespace LocalhostTunnel {
    interface ServerRequest {
      requestId: string
      path: string
      method: HTTPMethods
      headers: IncomingHttpHeaders
      body: {
        [x: string]: string
      }
    }
    interface ClientRequest extends LocalhostTunnel.ServerRequest {
      files?: globalThis.Express.Multer.File[]
    }
    interface LocalhostResponse {
      status: number
      headers: IncomingHttpHeaders
      data: Buffer | ArrayBuffer
    }
    interface ClientResponse extends LocalhostTunnel.LocalhostResponse {
      dataByteLength: number
    }
  }
}

// declare module 'express-serve-static-core' {
//     export interface Request {
//         prop: any;
//     }
//  }
