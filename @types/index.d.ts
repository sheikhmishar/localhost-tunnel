import express from 'express'
import {
  AxiosStatic,
  AxiosRequestConfig,
  Method as AxiosMethod,
  AxiosResponse,
  AxiosError
} from './axios'
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
      headers: IncomingHttpHeaders
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

    interface Response extends AxiosResponse {
      headers: IncomingHttpHeaders
      data: Buffer | ArrayBuffer
      request?: {
        start?: number
        end?: number
      }
    }
    interface Error extends AxiosError {}
  }
  namespace SocketIOClient {
    interface Emitter {
      removeAllListeners(event?: string | symbol): this
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
    interface ClientResponse extends Axios.Response {
      dataByteLength: number
    }
  }

  interface Window {
    readyState: 'loaded' | 'complete'
  }

  interface HTMLScriptElement {
    readyState: 'loaded' | 'complete'
    onreadystatechange:
      | ((this: Window, ev: ProgressEvent<Window>) => any)
      | null
  }
}

// declare module 'express-serve-static-core' {
//     export interface Request {
//         prop: any;
//     }
//  }
