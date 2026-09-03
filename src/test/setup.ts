import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered components between tests to avoid DOM/state leaking across tests.
afterEach(cleanup);
