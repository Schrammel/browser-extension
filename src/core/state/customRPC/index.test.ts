import { expect, test } from 'vitest';
import { Chain } from 'wagmi';

import { ChainId } from '~/core/types/chains';

import { customRPCsStore } from '.';

// Dummy CustomChain data
const TEST_RPC_1: Chain = {
  rpcUrls: {
    default: { http: ['http://test1.rpc'] },
    public: { http: ['http://test1.rpc'] },
  },
  id: ChainId.mainnet,
  name: 'Test RPC 1',
  network: 'rpc-1',
  nativeCurrency: {
    name: 'TR1',
    symbol: 'TR1',
    decimals: 18,
  },
  blockExplorers: {
    default: { name: '', url: 'http://test1.explorer' },
  },
};

const TEST_RPC_2: Chain = {
  rpcUrls: {
    default: { http: ['http://test2.rpc'] },
    public: { http: ['http://test2.rpc'] },
  },
  id: ChainId.mainnet,
  name: 'Test RPC 2',
  network: 'rpc-2',
  nativeCurrency: {
    name: 'TR2',
    symbol: 'TR2',
    decimals: 18,
  },
  blockExplorers: {
    default: { name: '', url: 'http://test2.explorer' },
  },
};

const TEST_RPC_3: Chain = {
  rpcUrls: {
    default: { http: ['http://test3.rpc'] },
    public: { http: ['http://test3.rpc'] },
  },
  id: ChainId.optimism,
  name: 'Test RPC 3',
  network: 'rpc-3',
  nativeCurrency: {
    name: 'TR3',
    symbol: 'TR3',
    decimals: 18,
  },
  blockExplorers: {
    default: { name: '', url: 'http://test3.explorer' },
  },
};

// Add
test('should be able to add a new custom RPC', async () => {
  customRPCsStore.getState().addCustomRPC({ chain: TEST_RPC_1 });
  const chain = customRPCsStore.getState().customChains[TEST_RPC_1.id];
  expect(chain.chains).toContainEqual(TEST_RPC_1);
});

test('should be able to add a new custom RPC to a Chain group already created', async () => {
  customRPCsStore.getState().addCustomRPC({ chain: TEST_RPC_2 });
  const chain = customRPCsStore.getState().customChains[TEST_RPC_2.id];
  expect(chain.chains).toContainEqual(TEST_RPC_2);
});

// Update
test('should be able to update an existing custom RPC', async () => {
  const updatedRpc = { ...TEST_RPC_1, name: 'Updated Test RPC 1' };
  customRPCsStore.getState().updateCustomRPC({ chain: updatedRpc });

  const chain = customRPCsStore.getState().customChains[TEST_RPC_1.id];
  expect(chain.chains).toContainEqual(updatedRpc);
  expect(chain.chains).toContainEqual(TEST_RPC_2);
});

// Set Active
test('should be able to set a custom RPC as active', async () => {
  customRPCsStore.getState().setActiveRPC({
    chainId: ChainId.mainnet,
    rpcUrl: TEST_RPC_1.rpcUrls.default.http[0],
  });

  const chain = customRPCsStore.getState().customChains[ChainId.mainnet];
  expect(chain.activeRpcUrl).toBe(TEST_RPC_1.rpcUrls.default.http[0]);
});

test("should be able to set a custom RPC as active to a different custom RPC in Chain's rpcs", async () => {
  customRPCsStore.getState().setActiveRPC({
    chainId: ChainId.mainnet,
    rpcUrl: TEST_RPC_2.rpcUrls.default.http[0],
  });

  const chain = customRPCsStore.getState().customChains[ChainId.mainnet];
  expect(chain.activeRpcUrl).toBe(TEST_RPC_2.rpcUrls.default.http[0]);
});

// Remove
test('should be able to remove an existing custom RPC', async () => {
  customRPCsStore.getState().addCustomRPC({ chain: TEST_RPC_3 }); // Add third RPC for removal

  customRPCsStore
    .getState()
    .removeCustomRPC({ rpcUrl: TEST_RPC_3.rpcUrls.default.http[0] });
  const chain = customRPCsStore.getState().customChains[TEST_RPC_3.id];
  expect(chain).toBeUndefined();
});

test('should remove activeRpcUrl if removed RPC was active and change to another RPC if available', async () => {
  customRPCsStore
    .getState()
    .removeCustomRPC({ rpcUrl: TEST_RPC_2.rpcUrls.default.http[0] });

  const chain = customRPCsStore.getState().customChains[ChainId.mainnet];
  expect(chain.activeRpcUrl).toBe(TEST_RPC_1.rpcUrls.default.http[0]);
  expect(chain.chains.length).toBe(1);
});

test('should remove the CustomChain if last RPC in it is removed', async () => {
  customRPCsStore
    .getState()
    .removeCustomRPC({ rpcUrl: TEST_RPC_1.rpcUrls.default.http[0] });

  const chain = customRPCsStore.getState().customChains[TEST_RPC_1.id];
  expect(chain).toBeUndefined();
});
