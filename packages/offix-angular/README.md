# [Offix Angular](https://github.com/cjohn001/apollo-angular/tree/master/packages/offix-angular) [![npm version](https://d25lcipzij17d.cloudfront.net/badge.svg?id=js&type=6&v=0.0.3&x2=0)]

Offix Angular delivers a truly offline first experience through the integration of an extended Apollo Graphql client known as Offix. The package allows to fetch data from your GraphQL server. You can use it for building complex and reactive UIs using the Angular framework. Offix Angular may be used in any context where Angular may be used. In the browser, in NativeScript, or Node.js.

Offix Angular is based on the great work of [Apollo Angular](https://www.apollographql.com/docs/angular/) and [Offix](https://offix.dev/). It moreover has first class support for code generation of your data integration layer via [GraphQL Code Generator](https://graphql-code-generator.com/).

What you get:

1. **First class view layer integration** between the Offix graphql client and the Angular 2+ framework.
2. **Strong typescript typing support** for your graphql data layer via the use of GraphQL Code Generator.
3. **Auto-generated data service integration** when used together with GraphQL Code Generator. Check out this [video](https://www.youtube.com/watch?v=KGBPODrjtKA) and decide if you still like to code your services by hand in your next project.
4. **Offline data storage and data sync with your backend** through the Offix client. Its not just a caching client like Apollo Angular but allows for long offline periods, data persistance and data sync when the client comes back online.

**Offix Angular** requires _no_ complex build setup to get up and running. As long as you have a GraphQL server you can get started building out your application with Angular immediately. Offix Angular works out of the box with both [Angular CLI](https://cli.angular.io/) (`ng add offix-angular`) and [NativeScript](https://www.nativescript.org/) with a single install.

**Offix Angular** provides a thin integration layer which brings together the strengths of Apollo Angular and the Offix framework.

**All tributes for this great development experience should go to the referenced projects.**

For usage you can follow the documentation at [Apollo Angular](https://www.apollographql.com/docs/angular/) and [Offix](https://offix.dev/docs/getting-started.html), just replace your `apollo-angular` imports with `offix-angular` and your `apollo-client` imports with `offix-client`.

**Notes:** When integrating Offix-Angular into Nativescript you have to polyfill the Window variable for offix client to work. Just set

`const Window = null;`

in your app.module.ts. The configuration for the offix client will look similar to the following code block:

```
function apolloOptionsFactory(
	httpLink: HttpLink,
	keycloakAuthService: KeycloakAuthService,
	sqliteStorage: SqliteStorageService,
	connectivityService: ConnectivityService
): ApolloOfflineClientOptions {
	// prepare authentication middleware
	const authMiddleware = setContext(async () => {
		try {
			const token = await keycloakAuthService.getValidAccessToken();
			return {
				headers: token !== '' ? { Authorization: 'Bearer ' + token } : {}
			};
		} catch (e) {}
	});

	// prepare http link
	const http = httpLink.create({ uri: environment.graphqlUrl });
	const link = concat(authMiddleware, http);

	// setup of cache with fragment matcher to support unions, interfaces and fragments
	const fragmentMatcher = new IntrospectionFragmentMatcher({
		introspectionQueryResultData
	});
	const cache = new InMemoryCache({ fragmentMatcher });

	// setup of cache persistor
	const cachePersistor = new CachePersistor({ cache: cache, storage: sqliteStorage });

	return {
		link: link,
		cache: cache,
		connectToDevTools: true,
		cachePersistor: cachePersistor,
		offlineStorage: sqliteStorage,
		cacheStorage: sqliteStorage,
		networkStatus: connectivityService
	};
}

@NgModule({
	schemas: [NO_ERRORS_SCHEMA],
	exports: [NativeScriptHttpClientModule, ApolloModule, HttpLinkModule],
	providers: [
		{
			provide: OFFIX_OPTIONS,
			useFactory: apolloOptionsFactory,
			deps: [HttpLink, KeycloakAuthService, SqliteStorageService, ConnectivityService]
		}
	]
})
export class GraphQLModule {}
```

Before sending your first query you need to ensure that offix client was initialized and data stores have been loaded into memory. When using plain angular, this can be done via

```
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: apolloClientFactory,
      deps: [VoyagerService],
      multi: true
    }
  ]
})
```

On a Nativescript platform the APP_INITIALZER approach does not work. An early initialization can be implemented via a root resolver when routing to the first page which sends a graphql query.

See this issue: https://github.com/NativeScript/nativescript-angular/issues/1487

**Usage notes for Graphql-Code-Generator:**

Thanks to the great work of Dothan Simha the GraphQL Code Generator can now be used out of the box with Offix-Angular when using the [TypeScript Apollo Angular Plugin](https://graphql-code-generator.com/docs/plugins/typescript-apollo-angular).

You need at least:

```
npx match-version @graphql-codegen 1.13.5-alpha-7b00b74c.0+7b00b74c
```

and should add the following config option:

```
config:
  apolloAngularPackage: 'offix-angular'
```

A configuration example can be found here:

https://github.com/dotansimha/graphql-code-generator/pull/3952#issuecomment-621863189

Offix Angular is free like free beer, so try it out today and use it at your own risk!
