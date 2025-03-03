import { useQuery } from '@tanstack/react-query';
import { Address } from 'wagmi';

import { metadataPostClient } from '~/core/graphql';
import { Transaction } from '~/core/graphql/__generated__/metadata';
import { createQueryKey } from '~/core/react-query';
import { currentCurrencyStore } from '~/core/state';
import { AddressOrEth, ParsedAsset } from '~/core/types/assets';
import { ChainId, ChainName } from '~/core/types/chains';
import { parseAsset } from '~/core/utils/assets';

const parseInterface = (interfaceName: string) => {
  switch (interfaceName) {
    case 'ERC20':
      return undefined;
    case 'ERC721':
      return 'erc-721';
    case 'ERC1155':
      return 'erc-1155';
    default:
      return undefined;
  }
};

const parseSimulationAsset = (asset: SimulationAsset, chainId: ChainId) => {
  return parseAsset({
    asset: {
      symbol: asset.symbol,
      name: asset.name,
      decimals: asset.decimals,
      networks: {
        [chainId]: {
          address: asset.assetCode,
          decimals: asset.decimals,
        },
      },
      asset_code: asset.assetCode,
      icon_url: asset.iconURL,
      interface: parseInterface(asset.interface),
    },
    currency: currentCurrencyStore.getState().currentCurrency,
  });
};

export const useSimulateTransaction = ({
  chainId,
  transaction,
  domain,
}: {
  chainId: ChainId;
  transaction: Transaction;
  domain: string;
}) => {
  return useQuery<TransactionSimulation, SimulationError>({
    queryKey: createQueryKey('simulateTransaction', {
      transaction,
      chainId,
      domain,
    }),
    queryFn: async () => {
      const response = (await metadataPostClient.simulateTransactions({
        chainId,
        transactions: [transaction],
        domain,
      })) as TransactionSimulationResponse;

      const { simulation, error } = response.simulateTransactions[0];

      if (error) throw error.type;

      return {
        chainId,
        in: simulation.in.map(({ asset, quantity }) => ({
          quantity,
          asset: parseSimulationAsset(asset, chainId),
        })),
        out: simulation.out.map(({ asset, quantity }) => ({
          quantity,
          asset: parseSimulationAsset(asset, chainId),
        })),
        approvals: simulation.approvals.map((approval) => ({
          ...approval,
          asset: parseSimulationAsset(approval.asset, chainId),
        })),
        meta: simulation.meta,
        hasChanges:
          simulation.in.length > 0 ||
          simulation.out.length > 0 ||
          simulation.approvals.length > 0,
      };
    },
    staleTime: 60 * 1000, // 1 min
  });
};
export type TransactionSimulation = {
  in: { asset: ParsedAsset; quantity: string }[];
  out: { asset: ParsedAsset; quantity: string }[];
  approvals: {
    asset: ParsedAsset;
    spender: SimulationApprovalSpender;
    // eslint-disable-next-line @typescript-eslint/ban-types
    quantityAllowed: 'UNLIMITED' | (string & {});
    quantityAtRisk: string;
  }[];
  meta: SimulationMeta;
  hasChanges: boolean;
  chainId: ChainId;
};
export type SimulationError = 'REVERT' | 'UNSUPPORTED';

type SourceCodeStatus = 'VERIFIED' | 'UNKNOWN';
type SimulationAsset = {
  assetCode: AddressOrEth;
  decimals: number;
  iconURL: string;
  name: string;
  network: ChainName;
  symbol: string;
  type: 'TOKEN';
  interface: 'ERC20';
  tokenId: '';
  status: SourceCodeStatus;
};

type SimulationChange = {
  asset: SimulationAsset;
  quantity: string;
};
type SimulationApprovalSpender = {
  address: Address;
  name: string;
  iconURL: string;
  function: string;
  created: string;
  sourceCodeStatus: SourceCodeStatus;
};
type SimulationMeta = {
  to: {
    address: Address;
    name: string;
    iconURL: string;
    function: string;
    created: null;
    sourceCodeStatus: SourceCodeStatus;
  };
};

type TransactionSimulationResponse = {
  simulateTransactions: [
    {
      scanning: {
        result: 'OK';
        description: '';
      };
      error: {
        message: string;
        type: SimulationError;
      };
      simulation: {
        in: SimulationChange[];
        out: SimulationChange[];
        approvals: {
          asset: SimulationAsset;
          spender: SimulationApprovalSpender;
          // eslint-disable-next-line @typescript-eslint/ban-types
          quantityAllowed: 'UNLIMITED' | (string & {});
          quantityAtRisk: string;
        }[];
        meta: SimulationMeta;
      };
    },
  ];
};
