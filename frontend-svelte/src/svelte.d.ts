declare const $state: <T>(initial: T) => T;
declare const $derived: <T>(fn: () => T) => T;
declare const $effect: (fn: () => void | (() => void)) => void;
