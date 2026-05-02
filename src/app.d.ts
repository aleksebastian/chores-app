// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('$lib/server/auth').User | null;
			session: import('$lib/server/auth').Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// View Transition API types
	interface ViewTransition {
		finished: Promise<void>;
		ready: Promise<void>;
		updateCallbackDone: Promise<void>;
		skipTransition: () => void;
	}

	interface Document {
		startViewTransition(updateCallback: () => Promise<void> | void): ViewTransition;
	}
}

export {};
