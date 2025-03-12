import axios from "axios";

export async function bitcoinRPC(method: string, params: Array<any>, rpcParams: any) {
  try {
    const response = await axios.post(
      `${rpcParams.rpcHost}:${rpcParams.rpcPort}`,
      {
        jsonrpc: "1.0",
        id: "bitcoin-rpc",
        method: method,
        params: params,
      },
      {
        auth: { username: rpcParams.rpcUser, password: rpcParams.rpcPass },
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.result;
  } catch (error: any) {
    console.error(`RPC Error: ${method}`, error.response?.data || error.message);
    return null;
  }
}
