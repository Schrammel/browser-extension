import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useCallback, useMemo } from 'react';

import { SUPPORTED_CHAINS } from '~/core/references';
import { useTokenSearch } from '~/core/resources/search';
import { ParsedSearchAsset } from '~/core/types/assets';
import { ChainId, ChainNameDisplay } from '~/core/types/chains';
import {
  SearchAsset,
  TokenSearchAssetKey,
  TokenSearchListId,
  TokenSearchThreshold,
} from '~/core/types/search';
import { addHexPrefix } from '~/core/utils/hex';
import { isLowerCaseMatch } from '~/core/utils/strings';

import { filterList } from '../utils/search';

import { isSameAsset } from './swap/useSwapAssets';
import { useFavoriteAssets } from './useFavoriteAssets';

const VERIFIED_ASSETS_PAYLOAD: {
  keys: TokenSearchAssetKey[];
  list: TokenSearchListId;
  threshold: TokenSearchThreshold;
  query: string;
} = {
  keys: ['symbol', 'name'],
  list: 'verifiedAssets',
  threshold: 'CONTAINS',
  query: '',
};

export type AssetToBuySectionId =
  | 'bridge'
  | 'favorites'
  | 'verified'
  | 'unverified'
  | 'other_networks';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const filterBridgeAsset = ({
  asset,
  filter = '',
}: {
  asset?: SearchAsset;
  filter?: string;
}) =>
  asset?.address?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.name?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.symbol?.toLowerCase()?.startsWith(filter?.toLowerCase());

export function useSearchCurrencyLists({
  assetToSell,
  inputChainId,
  outputChainId,
  searchQuery,
  bridge,
}: {
  assetToSell: SearchAsset | ParsedSearchAsset | null;
  // should be provided when swap input currency is selected
  inputChainId?: ChainId;
  // target chain id of current search
  outputChainId: ChainId;
  searchQuery?: string;
  // only show same asset on multiple chains
  bridge?: boolean;
}) {
  const query = searchQuery?.toLowerCase() || '';
  const enableUnverifiedSearch = query.trim().length > 2;

  const isCrosschainSearch = useMemo(() => {
    return inputChainId && inputChainId !== outputChainId;
  }, [inputChainId, outputChainId]);

  // provided during swap to filter token search by available routes
  const fromChainId = useMemo(() => {
    return isCrosschainSearch ? inputChainId : undefined;
  }, [inputChainId, isCrosschainSearch]);

  const queryIsAddress = useMemo(() => isAddress(query), [query]);

  const keys: TokenSearchAssetKey[] = useMemo(
    () => (queryIsAddress ? ['address'] : ['name', 'symbol']),
    [queryIsAddress],
  );

  const threshold: TokenSearchThreshold = useMemo(
    () => (queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS'),
    [queryIsAddress],
  );

  // static search data
  const {
    data: mainnetVerifiedAssets,
    isLoading: mainnetVerifiedAssetsLoading,
  } = useTokenSearch({
    chainId: ChainId.mainnet,
    ...VERIFIED_ASSETS_PAYLOAD,
    fromChainId,
  });

  const {
    data: optimismVerifiedAssets,
    isLoading: optimismVerifiedAssetsLoading,
  } = useTokenSearch({
    chainId: ChainId.optimism,
    ...VERIFIED_ASSETS_PAYLOAD,
    fromChainId,
  });

  const { data: bscVerifiedAssets, isLoading: bscVerifiedAssetsLoading } =
    useTokenSearch({
      chainId: ChainId.bsc,
      ...VERIFIED_ASSETS_PAYLOAD,
      fromChainId,
    });

  const {
    data: polygonVerifiedAssets,
    isLoading: polygonVerifiedAssetsLoading,
  } = useTokenSearch({
    chainId: ChainId.polygon,
    ...VERIFIED_ASSETS_PAYLOAD,
    fromChainId,
  });

  const {
    data: arbitrumVerifiedAssets,
    isLoading: arbitrumVerifiedAssetsLoading,
  } = useTokenSearch({
    chainId: ChainId.arbitrum,
    ...VERIFIED_ASSETS_PAYLOAD,
    fromChainId,
  });

  const { data: baseVerifiedAssets, isLoading: baseVerifiedAssetsLoading } =
    useTokenSearch({
      chainId: ChainId.base,
      ...VERIFIED_ASSETS_PAYLOAD,
      fromChainId,
    });

  const { data: zoraVerifiedAssets, isLoading: zoraVerifiedAssetsLoading } =
    useTokenSearch({
      chainId: ChainId.zora,
      ...VERIFIED_ASSETS_PAYLOAD,
      fromChainId,
    });

  // current search
  const { data: targetVerifiedAssets, isLoading: targetVerifiedAssetsLoading } =
    useTokenSearch({
      chainId: outputChainId,
      keys,
      list: 'verifiedAssets',
      threshold,
      query,
      fromChainId,
    });
  const {
    data: targetUnverifiedAssets,
    isLoading: targetUnverifiedAssetsLoading,
  } = useTokenSearch(
    {
      chainId: outputChainId,
      keys,
      list: 'highLiquidityAssets',
      threshold,
      query,
      fromChainId,
    },
    {
      enabled: enableUnverifiedSearch,
    },
  );

  const { favorites } = useFavoriteAssets();

  const favoritesList = useMemo(() => {
    const favoritesByChain = favorites[outputChainId];
    if (query === '') {
      return favoritesByChain;
    } else {
      const formattedQuery = queryIsAddress
        ? addHexPrefix(query).toLowerCase()
        : query;
      return filterList<SearchAsset>(
        favoritesByChain || [],
        formattedQuery,
        keys,
        {
          threshold: queryIsAddress
            ? rankings.CASE_SENSITIVE_EQUAL
            : rankings.CONTAINS,
        },
      );
    }
  }, [favorites, keys, outputChainId, query, queryIsAddress]);

  // static verified asset lists prefetched to display curated lists
  // we only display crosschain exact matches if located here
  const verifiedAssets = useMemo(
    () => ({
      [ChainId.mainnet]: {
        assets: mainnetVerifiedAssets,
        loading: mainnetVerifiedAssetsLoading,
      },
      [ChainId.optimism]: {
        assets: optimismVerifiedAssets,
        loading: optimismVerifiedAssetsLoading,
      },
      [ChainId.bsc]: {
        assets: bscVerifiedAssets,
        loading: bscVerifiedAssetsLoading,
      },
      [ChainId.polygon]: {
        assets: polygonVerifiedAssets,
        loading: polygonVerifiedAssetsLoading,
      },
      [ChainId.arbitrum]: {
        assets: arbitrumVerifiedAssets,
        loading: arbitrumVerifiedAssetsLoading,
      },
      [ChainId.base]: {
        assets: baseVerifiedAssets,
        loading: baseVerifiedAssetsLoading,
      },
      [ChainId.zora]: {
        assets: zoraVerifiedAssets,
        loading: zoraVerifiedAssetsLoading,
      },
    }),
    [
      mainnetVerifiedAssets,
      mainnetVerifiedAssetsLoading,
      optimismVerifiedAssets,
      optimismVerifiedAssetsLoading,
      bscVerifiedAssets,
      bscVerifiedAssetsLoading,
      polygonVerifiedAssets,
      polygonVerifiedAssetsLoading,
      arbitrumVerifiedAssets,
      arbitrumVerifiedAssetsLoading,
      baseVerifiedAssets,
      baseVerifiedAssetsLoading,
      zoraVerifiedAssets,
      zoraVerifiedAssetsLoading,
    ],
  );

  const getCuratedAssets = useCallback(
    (chainId: ChainId) =>
      verifiedAssets[chainId].assets?.filter(
        ({ isRainbowCurated }) => isRainbowCurated,
      ),
    [verifiedAssets],
  );

  const bridgeAsset = useMemo(() => {
    const curatedAssets = getCuratedAssets(outputChainId);
    const bridgeAsset = curatedAssets?.find((asset) =>
      isLowerCaseMatch(
        asset.mainnetAddress,
        assetToSell?.[
          assetToSell?.chainId === ChainId.mainnet
            ? 'address'
            : 'mainnetAddress'
        ],
      ),
    );
    const filteredBridgeAsset = filterBridgeAsset({
      asset: bridgeAsset,
      filter: query,
    })
      ? bridgeAsset
      : null;
    return outputChainId === assetToSell?.chainId ? null : filteredBridgeAsset;
  }, [assetToSell, getCuratedAssets, outputChainId, query]);

  const loading = useMemo(() => {
    return query === ''
      ? verifiedAssets[outputChainId].loading
      : targetVerifiedAssetsLoading || targetUnverifiedAssetsLoading;
  }, [
    outputChainId,
    targetUnverifiedAssetsLoading,
    targetVerifiedAssetsLoading,
    query,
    verifiedAssets,
  ]);

  // displayed when no search query is present
  const curatedAssets = useMemo(
    () => ({
      [ChainId.mainnet]: getCuratedAssets(ChainId.mainnet),
      [ChainId.optimism]: getCuratedAssets(ChainId.optimism),
      [ChainId.bsc]: getCuratedAssets(ChainId.bsc),
      [ChainId.polygon]: getCuratedAssets(ChainId.polygon),
      [ChainId.arbitrum]: getCuratedAssets(ChainId.arbitrum),
      [ChainId.base]: getCuratedAssets(ChainId.base),
      [ChainId.zora]: getCuratedAssets(ChainId.zora),
    }),
    [getCuratedAssets],
  );

  const bridgeList =
    bridge &&
    assetToSell?.networks &&
    Object.entries(assetToSell.networks)
      .map(([_chainId, assetOnNetworkOverrides]) => {
        if (!assetOnNetworkOverrides) return;
        const chainId = +_chainId as unknown as ChainId; // Object.entries messes the type
        const { address, decimals } = assetOnNetworkOverrides;
        // filter out the asset we're selling already
        if (
          isSameAsset(assetToSell, { chainId, address }) ||
          !SUPPORTED_CHAINS.some((n) => n.id === chainId)
        )
          return;
        return {
          ...assetToSell,
          chainId,
          chainName: ChainNameDisplay[chainId],
          uniqueId: `${address}-${chainId}`,
          address,
          decimals,
        };
      })
      .filter(Boolean);

  const crosschainExactMatches = Object.values(verifiedAssets)
    ?.map((verifiedList) => {
      return verifiedList.assets?.filter((t) => {
        const symbolMatch = isLowerCaseMatch(t?.symbol, query);
        const nameMatch = isLowerCaseMatch(t?.name, query);
        return symbolMatch || nameMatch;
      });
    })
    .flat()
    .filter(Boolean);

  const filterAssetsFromBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      assets?.filter(
        (curatedAsset) =>
          !isLowerCaseMatch(curatedAsset?.address, bridgeAsset?.address) &&
          !isLowerCaseMatch(curatedAsset?.address, assetToSell?.address),
      ) || [],
    [assetToSell?.address, bridgeAsset?.address],
  );

  const filterAssetsFromFavoritesBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      filterAssetsFromBridgeAndAssetToSell(assets)?.filter(
        (curatedAsset) =>
          !favoritesList
            ?.map((fav) => fav.address)
            .includes(curatedAsset.address),
      ) || [],
    [favoritesList, filterAssetsFromBridgeAndAssetToSell],
  );

  // the lists below should be filtered by favorite/bridge asset match
  const results = useMemo(() => {
    const sections: AssetToBuySection[] = [];
    if (bridge) {
      sections.push({ data: bridgeList || [], id: 'bridge' });
      return sections;
    }

    if (bridgeAsset) {
      sections.push({
        data: [bridgeAsset],
        id: 'bridge',
      });
    }
    if (favoritesList?.length) {
      sections.push({
        data: filterAssetsFromBridgeAndAssetToSell(favoritesList),
        id: 'favorites',
      });
    }

    if (query === '') {
      sections.push({
        data: filterAssetsFromFavoritesBridgeAndAssetToSell(
          curatedAssets[outputChainId],
        ),
        id: 'verified',
      });
    } else {
      if (targetVerifiedAssets?.length) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(
            targetVerifiedAssets,
          ),
          id: 'verified',
        });
      }

      if (targetUnverifiedAssets?.length && enableUnverifiedSearch) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(
            targetUnverifiedAssets,
          ),
          id: 'unverified',
        });
      }

      if (!sections.length && crosschainExactMatches?.length) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(
            crosschainExactMatches,
          ),
          id: 'other_networks',
        });
      }
    }

    return sections;
  }, [
    bridgeAsset,
    favoritesList,
    query,
    filterAssetsFromBridgeAndAssetToSell,
    filterAssetsFromFavoritesBridgeAndAssetToSell,
    curatedAssets,
    outputChainId,
    targetVerifiedAssets,
    targetUnverifiedAssets,
    crosschainExactMatches,
    bridgeList,
    bridge,
    enableUnverifiedSearch,
  ]);

  return {
    loading,
    results,
  };
}
