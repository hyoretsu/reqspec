import { GlobalRegistrator } from "@happy-dom/global-registrator";
import "fake-indexeddb/auto";

// DOM for component/hook tests; fake-indexeddb for repository tests.
GlobalRegistrator.register();
