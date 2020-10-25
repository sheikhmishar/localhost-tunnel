import http from 'http'
import assert from 'assert'
import express from 'express'
import { Chalk as chalk } from 'chalk'
import morgan from 'morgan'
import {
  AxiosStatic,
  AxiosRequestConfig,
  Method as AxiosMethod,
  AxiosResponse,
  AxiosError
} from './axios'
import { CorsOptions, CorsOptionsDelegate } from 'cors'

declare global {
  const axios: AxiosStatic
  const chai: { assert: typeof assert }
  type IncomingHttpHeaders = HTTP.IncomingHttpHeaders
  type HTTPMethods = AxiosMethod
  type Morgan = typeof morgan

  namespace HTTP {
    interface IncomingHttpHeaders extends http.IncomingHttpHeaders {}
    interface IncomingMessage extends http.IncomingMessage {}
    interface ServerResponse extends http.ServerResponse {}
  }

  namespace Axios {
    type data =
      | string
      | FormData
      | {
          [x: string]: string
        }
    interface RequestConfig extends AxiosRequestConfig {
      headers?: IncomingHttpHeaders
      data?: Axios.data
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
      config: Axios.RequestConfig
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
    namespace Cors {
      interface Options extends CorsOptions {}
      interface OptionDelegate extends CorsOptionsDelegate {}
    }
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

  interface Chalk extends chalk {}

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
