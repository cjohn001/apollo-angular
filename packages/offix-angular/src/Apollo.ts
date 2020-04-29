import {Injectable, Optional, Inject, NgZone} from '@angular/core';
import {
  //  ApolloClient,
  QueryOptions,
  MutationOptions,
  ApolloQueryResult,
  SubscriptionOptions,
  ObservableQuery,
} from 'apollo-client';
import {FetchResult} from 'apollo-link';
import {Observable, from} from 'rxjs';
import {ApolloOfflineClient, ApolloOfflineClientOptions} from 'offix-client';

import {QueryRef} from './QueryRef';
import {
  WatchQueryOptions,
  ExtraSubscriptionOptions,
  R,
  NamedOptions,
} from './types';
import {OFFIX_OPTIONS, OFFIX_NAMED_OPTIONS} from './tokens';
import {fromPromise, wrapWithZone, fixObservable} from './utils';

export class ApolloBase {
  constructor(
    protected ngZone: NgZone,
    protected _client?: ApolloOfflineClient,
  ) {}

  public watchQuery<T, V = R>(options: WatchQueryOptions<V>): QueryRef<T, V> {
    return new QueryRef<T, V>(
      this.ensureClient().watchQuery<T, V>({...options}) as ObservableQuery<
        T,
        V
      >,
      this.ngZone,
      options,
    );
  }

  public query<T, V = R>(
    options: QueryOptions<V>,
  ): Observable<ApolloQueryResult<T>> {
    return fromPromise<ApolloQueryResult<T>>(() =>
      this.ensureClient().query<T, V>({...options}),
    );
  }

  public mutate<T, V = R>(
    options: MutationOptions<T, V>,
  ): Observable<FetchResult<T>> {
    return fromPromise<FetchResult<T>>(() =>
      this.ensureClient().mutate<T, V>({...options}),
    );
  }

  public subscribe<T, V = R>(
    options: SubscriptionOptions<V>,
    extra?: ExtraSubscriptionOptions,
  ): Observable<FetchResult<T>> {
    const obs = from(
      fixObservable(
        this.ensureClient().subscribe<T, V>({...options}),
      ),
    );

    return extra && extra.useZone !== true
      ? obs
      : wrapWithZone(obs, this.ngZone);
  }

  /**
   * Get an access to an instance of ApolloClient
   */
  public getClient() {
    return this._client;
  }

  /**
   * Set a new instance of ApolloClient
   * Remember to clean up the store before setting a new client.
   *
   * @param client ApolloClient instance
   */
  public setClient(client: ApolloOfflineClient) {
    if (this._client) {
      throw new Error('Client has been already defined');
    }

    this._client = client;
  }

  private ensureClient() {
    this.checkInstance();

    return this._client;
  }

  private checkInstance(): void {
    if (!this._client) {
      throw new Error('Client has not been defined yet');
    }
  }
}

@Injectable()
export class Apollo extends ApolloBase {
  private map: Map<string, ApolloBase> = new Map<string, ApolloBase>();

  constructor(
    private _ngZone: NgZone,
    @Optional()
    @Inject(OFFIX_OPTIONS)
    apolloOptions?: ApolloOfflineClientOptions,
    @Optional()
    @Inject(OFFIX_NAMED_OPTIONS)
    apolloNamedOptions?: NamedOptions,
  ) {
    super(_ngZone);

    if (apolloOptions) {
      this.createDefault(apolloOptions);
    }

    if (apolloNamedOptions && typeof apolloNamedOptions === 'object') {
      for (const name in apolloNamedOptions) {
        if (apolloNamedOptions.hasOwnProperty(name)) {
          const options = apolloNamedOptions[name];
          this.createNamed(name, options);
        }
      }
    }
  }

  /**
   * Create an instance of ApolloClient
   * @param options Options required to create ApolloClient
   * @param name client's name
   */
  public create(options: ApolloOfflineClientOptions, name?: string): void {
    if (isDefault(name)) {
      this.createDefault(options);
    } else {
      this.createNamed(name, options);
    }
  }

  /**
   * Use a default ApolloClient
   */
  public default(): ApolloBase {
    return this;
  }

  /**
   * Use a named ApolloClient
   * @param name client's name
   */
  public use(name: string): ApolloBase {
    if (isDefault(name)) {
      return this.default();
    }
    return this.map.get(name);
  }

  /**
   * Create a default ApolloClient, same as `apollo.create(options)`
   * @param options ApolloClient's options
   */
  public createDefault(options: ApolloOfflineClientOptions): void {
    if (this.getClient()) {
      throw new Error('Apollo has been already created.');
    }

    return this.setClient(new ApolloOfflineClient(options));
  }

  /**
   * Create a named ApolloClient, same as `apollo.create(options, name)`
   * @param name client's name
   * @param options ApolloClient's options
   */
  public createNamed(name: string, options: ApolloOfflineClientOptions): void {
    if (this.map.has(name)) {
      throw new Error(`Client ${name} has been already created`);
    }
    this.map.set(
      name,
      new ApolloBase(this._ngZone, new ApolloOfflineClient(options)),
    );
  }

  /**
   * Remember to clean up the store before removing a client
   * @param name client's name
   */
  public removeClient(name?: string): void {
    if (isDefault(name)) {
      this._client = undefined;
    } else {
      this.map.delete(name);
    }
  }
}

function isDefault(name?: string): boolean {
  return !name || name === 'default';
}
