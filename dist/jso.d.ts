export declare type ResponseType =
  'id_token token' |
  'code id_token'  |
  'token'          |
  'code'

export declare type TokenType =
  'Bearer'

export declare interface Request {
  providerID: string,
  response_type: ResponseType
  redirect_uri?: string,
  client_id: string,
  state: string
  openid: boolean,
  scope?: string,
  nonce?: string
  scopes?: string[],
  restoreHash?: string
}

export declare interface AuthorizationResponse extends Response {
  code: string
}

export declare interface ImplicitResponse extends Response {
  access_token: string
}

export declare interface Response {
  expires_in: number
  scope: string
  state: string
  token_type: TokenType
}

export declare interface Token {
  access_token: string
  expires: number
  expires_in: number
  received: number
  scopes: string[]
  state: string
  token_type: TokenType
}

export declare class JSO extends EventEmitter {
  constructor(config: ConfigOptions)

  callback(data?: Response | string): Token | Promise<Token> | undefined
  checkToken(opts?: TokenOptions): Token | undefined
  configure(config: ConfigOptions): void
  dump(): Token[]
  getProviderID(): string
  getToken(opts?: TokenOptions): Promise<Token>
  setLoader(loader: BasicLoader): void
  setStore(newstore: Store): void
  wipeTokens(): void
}

export declare class EventEmitter {
  on(type: string, callback: (args: any) => void): void
  emit(type: string, ...args: any[]): void
}

export declare interface TokenOptions {
  scopes?: ScopeOptions,
  allowredir?: boolean
}

export declare class Config {
  constructor(...opts: ConfigOptions[])
  
  has(key: string): Boolean
  
  getValue<K extends keyof ConfigOptions>(
    key: K,
    defaultValue: ConfigOptions[K],
    isRequired: Boolean
  ): ConfigOptions[K]
}

export declare interface ConfigOptions {
  providerID?: string
  client_id: string
  client_secret?: string
  authorization: string
  token: string
  redirect_uri?: string
  scopes?: ScopeOptions
  default_lifetime?: number
  permanent_scope?: string
  response_type?: ResponseType
  debug?: boolean
  request?: Partial<Request>
}

export declare interface ScopeOptions {
  require?: string[]
  request?: string[]
}

export declare class Store {
  constructor()

  saveState<V>(state: String, obj: V): void
  getState<V>(state: String): V

  hasScope(token: Token, scope: string): boolean
  
  filterTokens(tokens: Token[], scopes: string[]): Token[]
  
  saveToken(provider: string, token: Token): void
  saveTokens(provider: string, tokens: Token[]): void
  
  wipeTokens(provider: string): void

  getToken(provider: string, scopes: string[]): Token
  getTokens(provider: string): Token[]
}

// Errors
export declare class Error {
	constructor(props: any)

	set(key: any, value: any): Error
}

export declare class ExpiredTokenError extends Error {}
export declare class HTTPError extends Error {}
export declare class OAuthResponseError extends Error {
  toString(): string
}

// Loaders
export declare class BasicLoader {
  constructor(url: string)

  execute(): Promise<void>
}

export declare class HTTPRedirect extends BasicLoader {}
export declare class IFramePassive extends BasicLoader {}
export declare class Popup extends BasicLoader {}
