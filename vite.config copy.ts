import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts", // Main entry point
      name: "ClarityBitcoinClient",
      fileName: (format) => `clarity-bitcoin-client.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["@stacks/transactions", "@scure/btc-signer"],
      output: {
        globals: {
          "@stacks/transactions": "StacksTransactions",
          "@scure/btc-signer": "ScureBtcSigner",
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true, // ✅ Ensures `dist/index.d.ts` is created
      rollupTypes: true, // ✅ Ensures all types are generated
    }),
  ],
});
