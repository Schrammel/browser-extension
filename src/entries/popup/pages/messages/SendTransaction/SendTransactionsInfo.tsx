/* eslint-disable @typescript-eslint/ban-types */
import { TransactionRequest } from '@ethersproject/abstract-provider';
import { formatUnits } from '@ethersproject/units';
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

import { DAppStatus } from '~/core/graphql/__generated__/metadata';
import { i18n } from '~/core/languages';
import { useDappMetadata } from '~/core/resources/metadata/dapp';
import { useRegistryLookup } from '~/core/resources/transactions/registryLookup';
import { ProviderRequestPayload } from '~/core/transports/providerRequestTransport';
import { ChainId } from '~/core/types/chains';
import { formatNumber } from '~/core/utils/formatNumber';
import {
  Bleed,
  Box,
  Inline,
  Separator,
  Stack,
  Symbol,
  Text,
} from '~/design-system';
import {
  SymbolName,
  TextColor,
  globalColors,
} from '~/design-system/styles/designTokens';
import { AddressDisplay } from '~/entries/popup/components/AddressDisplay';
import { ChainBadge } from '~/entries/popup/components/ChainBadge/ChainBadge';
import { CoinIcon } from '~/entries/popup/components/CoinIcon/CoinIcon';
import { DappIcon } from '~/entries/popup/components/DappIcon/DappIcon';
import { Spinner } from '~/entries/popup/components/Spinner/Spinner';
import { Tag } from '~/entries/popup/components/Tag';
import { useAppSession } from '~/entries/popup/hooks/useAppSession';

import { DappHostName, ThisDappIsLikelyMalicious } from '../DappScanStatus';
import { TabContent, Tabs } from '../Tabs';
import {
  TransactionSimulation,
  useSimulateTransaction,
} from '../useSimulateTransaction';

import { overflowGradient } from './OverflowGradient.css';

interface SendTransactionProps {
  request: ProviderRequestPayload;
}

const InfoRow = ({
  symbol,
  label,
  value,
}: {
  symbol: SymbolName;
  label: ReactNode;
  value: ReactNode;
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    gap="4px"
  >
    <Inline alignVertical="center" space="12px" wrap={false}>
      <Symbol size={14} symbol={symbol} weight="medium" color="labelTertiary" />
      <Text color="labelTertiary" size="12pt" weight="semibold">
        {label}
      </Text>
    </Inline>
    <Text
      color="labelSecondary"
      size="12pt"
      weight="semibold"
      cursor="text"
      userSelect="all"
    >
      {value}
    </Text>
  </Box>
);

function SimulatedChangeRow({
  asset,
  quantity,
  symbol,
  color,
  label,
}: {
  asset: TransactionSimulation['in'][0]['asset'];
  quantity: (string & {}) | 'UNLIMITED';
  symbol: ReactNode;
  color: TextColor;
  label: string;
}) {
  return (
    <Inline space="24px" alignHorizontal="justify" alignVertical="center">
      <Inline space="12px" alignVertical="center">
        {symbol}
        <Text size="14pt" weight="bold" color="label">
          {label}
        </Text>
      </Inline>
      <Inline space="6px" alignVertical="center">
        <CoinIcon asset={asset} size={14} />
        <Text size="14pt" weight="bold" color={color}>
          {quantity === 'UNLIMITED'
            ? i18n.t('approvals.unlimited')
            : formatNumber(formatUnits(quantity, asset.decimals))}{' '}
          {asset.symbol}
        </Text>
      </Inline>
    </Inline>
  );
}

function SimulationOverview({
  request,
  domain,
}: {
  request: TransactionRequest;
  domain: string;
}) {
  const { data: simulation, status } = useSimulateTransaction({
    chainId: request.chainId || ChainId.mainnet,
    transaction: {
      from: request.from || '',
      to: request.to || '',
      value: request.value?.toString() || '0',
      data: request.data?.toString() || '',
    },
    domain,
  });

  console.log(simulation);

  return (
    <Stack space="16px">
      <Text size="12pt" weight="semibold" color="labelTertiary">
        Simulated Result
      </Text>

      {status === 'loading' && (
        <Inline alignVertical="center" space="8px">
          <Spinner size={16} color="blue" />
          <Text size="14pt" weight="semibold" color="blue">
            Simulating...
          </Text>
        </Inline>
      )}

      {status === 'error' && (
        <Inline alignVertical="center" space="8px">
          <Symbol symbol="xmark.circle" size={16} color="red" weight="bold" />
          <Text size="14pt" weight="semibold" color="red">
            Error Simulating
          </Text>
        </Inline>
      )}

      {/* const color = direction === 'in' ? 'green' : 'red';
  const icon =
    direction === 'in' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill';
  const label = direction === 'in' ? 'Received' : 'Sent'; */}

      {status === 'success' && (
        <Stack space="14px">
          {simulation.in.map(({ asset, quantity }) => (
            <SimulatedChangeRow
              key={asset.address}
              asset={asset}
              quantity={quantity}
              color="green"
              symbol={
                <Symbol
                  size={14}
                  symbol="arrow.up.circle.fill"
                  weight="bold"
                  color="green"
                />
              }
              label="Received"
            />
          ))}
          {simulation.out.map(({ asset, quantity }) => (
            <SimulatedChangeRow
              key={asset.address}
              asset={asset}
              quantity={quantity}
              color="red"
              symbol={
                <Symbol
                  size={14}
                  symbol="arrow.down.circle.fill"
                  weight="bold"
                  color="red"
                />
              }
              label="Sent"
            />
          ))}
          {simulation.approvals.map(({ asset, quantityAllowed }) => (
            <SimulatedChangeRow
              key={asset.address}
              asset={asset}
              quantity={quantityAllowed}
              color="label"
              symbol={
                <Symbol
                  size={14}
                  symbol="checkmark.seal.fill"
                  weight="bold"
                  color="blue"
                />
              }
              label="Approve"
            />
          ))}
        </Stack>
      )}

      <Separator color="separatorTertiary" />

      <InfoRow
        symbol="network"
        label="Chain"
        value={
          <Inline space="6px" alignVertical="center">
            <ChainBadge chainId={1} size={14} />
            <Text size="12pt" weight="semibold" color="labelSecondary">
              ETH
            </Text>
          </Inline>
        }
      />

      <InfoRow
        symbol="app.badge.checkmark"
        label="App"
        value={
          <Tag
            size="12pt"
            color="blue"
            style={{ borderColor: globalColors.blueA10 }}
            bleed
            left={
              <Bleed vertical="3px">
                <Symbol
                  symbol="checkmark.seal.fill"
                  size={11}
                  weight="bold"
                  color="blue"
                />
              </Bleed>
            }
          >
            opensea.io
          </Tag>
        }
      />
    </Stack>
  );
}

function TransactionDetails() {
  return (
    <Box gap="16px" display="flex" flexDirection="column">
      <InfoRow symbol="number" label="Nonce" value={28} />
      <InfoRow
        symbol="curlybraces"
        label="Function"
        value={
          <Tag size="12pt" color="labelSecondary" bleed>
            Fullfill Basic Order
          </Tag>
        }
      />
      <InfoRow
        symbol="doc.plaintext"
        label="Contract"
        value={
          <AddressDisplay
            address="0x507F0daA42b215273B8a063B092ff3b6d27767aF"
            hideAvatar
          />
        }
      />
      <InfoRow symbol="person" label="Contract Name" value="Seaport 1.1" />
      <InfoRow
        symbol="calendar"
        label="Contract Created"
        value="8 months ago"
      />
      <InfoRow
        symbol="doc.text.magnifyingglass"
        label="Source Code"
        value={
          <Tag
            size="12pt"
            color="green"
            style={{ borderColor: globalColors.greenA10 }}
            bleed
          >
            Verified
          </Tag>
        }
      />
    </Box>
  );
}

function TransactionData({ data }: { data: string }) {
  return (
    <Box
      style={{ maxHeight: 230 }}
      className={overflowGradient}
      marginTop="-16px"
      marginBottom="-20px"
    >
      <Box
        style={{
          maxHeight: 174,
          paddingTop: '16px',
          paddingBottom: '38px',
          overflow: 'scroll',
        }}
      >
        <Text size="12pt" weight="medium" color="labelSecondary">
          <span style={{ wordWrap: 'break-word' }}>{data}</span>
        </Text>
      </Box>
    </Box>
  );
}

export function SendTransactionInfo({ request }: SendTransactionProps) {
  const dappUrl = request?.meta?.sender?.url || '';
  const { data: dappMetadata } = useDappMetadata({ url: dappUrl });
  const { activeSession } = useAppSession({ host: dappMetadata?.appHost });

  const txRequest = request?.params?.[0] as TransactionRequest;
  const txData = txRequest?.data?.toString() || '';

  const chainId = activeSession?.chainId || ChainId.mainnet;

  const { data: methodName = '' } = useRegistryLookup({
    data: (txRequest?.data as string) || null,
    to: txRequest?.to || null,
    chainId,
    hash: null,
  });

  const [expanded, setExpanded] = useState(false);

  // dappMetadata.status = DAppStatus.Scam;
  const isScamDapp = dappMetadata?.status === DAppStatus.Scam;

  return (
    <Box
      background="surfacePrimaryElevatedSecondary"
      style={{ minHeight: 397, height: '100%' }}
      borderColor="separatorTertiary"
      borderWidth="1px"
    >
      <Stack
        space="24px"
        paddingHorizontal="20px"
        paddingTop="40px"
        paddingBottom="16px"
        height="full"
      >
        <motion.div
          style={{ height: expanded ? 'auto' : 0, overflow: 'hidden' }}
        >
          <Stack space="16px" alignItems="center">
            <DappIcon appLogo={dappMetadata?.appLogo} size="36px" />
            <Stack space="12px">
              <DappHostName
                hostName={dappMetadata?.appHostName}
                dappStatus={dappMetadata?.status}
              />
              <Text
                align="center"
                size="14pt"
                weight="bold"
                color={isScamDapp ? 'red' : 'labelSecondary'}
              >
                {methodName}
              </Text>
            </Stack>
          </Stack>
        </motion.div>
        <Box
          display="flex"
          flexDirection="column"
          gap="20px"
          alignItems="center"
          height="full"
          style={{ overflow: expanded ? 'scroll' : 'hidden', height: '100%' }}
        >
          <Tabs
            tabs={['Overview', 'Details', 'Data']}
            expanded={expanded}
            onExpand={() => setExpanded((e) => !e)}
          >
            <TabContent value="Overview">
              <SimulationOverview domain={dappUrl} request={txRequest} />
            </TabContent>
            <TabContent value="Details">
              <TransactionDetails />
            </TabContent>
            <TabContent value="Data">
              <TransactionData data={txData} />
            </TabContent>
          </Tabs>

          {dappMetadata?.status === DAppStatus.Scam ? (
            <ThisDappIsLikelyMalicious />
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
