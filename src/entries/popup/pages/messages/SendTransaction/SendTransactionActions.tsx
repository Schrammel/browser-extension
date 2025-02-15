import { DAppStatus } from '~/core/graphql/__generated__/metadata';
import { i18n } from '~/core/languages';
import { shortcuts } from '~/core/references/shortcuts';
import { ChainId } from '~/core/types/chains';
import { Inline } from '~/design-system';
import { useApproveAppRequestValidations } from '~/entries/popup/hooks/approveAppRequest/useApproveAppRequestValidations';
import useKeyboardAnalytics from '~/entries/popup/hooks/useKeyboardAnalytics';
import { useKeyboardShortcut } from '~/entries/popup/hooks/useKeyboardShortcut';

import { AcceptRequestButton, RejectRequestButton } from '../BottomActions';

export const SendTransactionActions = ({
  chainId,
  onAcceptRequest,
  onRejectRequest,
  waitingForDevice,
  loading = false,
  dappStatus,
}: {
  chainId: ChainId;
  onAcceptRequest: () => void;
  onRejectRequest: () => void;
  waitingForDevice: boolean;
  loading: boolean;
  dappStatus?: DAppStatus;
}) => {
  const { enoughNativeAssetForGas, buttonLabel } =
    useApproveAppRequestValidations({ chainId, dappStatus });

  const { trackShortcut } = useKeyboardAnalytics();
  useKeyboardShortcut({
    handler: (e: KeyboardEvent) => {
      if (e.key === shortcuts.transaction_request.CANCEL.key) {
        trackShortcut({
          key: shortcuts.transaction_request.CANCEL.display,
          type: 'send.cancel',
        });
        e.preventDefault();
        onRejectRequest();
      }
    },
  });

  return (
    <Inline space="12px" wrap={false}>
      <RejectRequestButton
        autoFocus
        onClick={onRejectRequest}
        label={i18n.t('common_actions.cancel')}
        dappStatus={dappStatus}
      />
      {enoughNativeAssetForGas && (
        <AcceptRequestButton
          onClick={onAcceptRequest}
          label={
            waitingForDevice
              ? i18n.t('approve_request.confirm_hw')
              : buttonLabel
          }
          waitingForDevice={waitingForDevice}
          loading={loading}
          dappStatus={dappStatus}
        />
      )}
    </Inline>
  );
};
