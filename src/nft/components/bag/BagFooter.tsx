import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import { parseEther } from "@ethersproject/units";
import { t, Trans } from "@lingui/macro";
import { TraceEvent } from "@uniswap/analytics";
import {
  BrowserEvent,
  InterfaceElementName,
  NFTEventName,
} from "@uniswap/analytics-events";
import { formatPriceImpact } from "@uniswap/conedison/format";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import Column from "components/Column";
import Loader from "components/Loader";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import Row from "components/Row";
import CurrencySearchModal from "components/SearchModal/CurrencySearchModal";
import { LoadingBubble } from "components/Tokens/loading";
import { MouseoverTooltip } from "components/Tooltip";
import { SupportedChainId } from "constants/chains";
import { usePayWithAnyTokenEnabled } from "featureFlags/flags/payWithAnyToken";
import { useCurrency } from "hooks/Tokens";
import { AllowanceState } from "hooks/usePermit2Allowance";
import { useStablecoinValue } from "hooks/useStablecoinPrice";
import { useTokenBalance } from "lib/hooks/useCurrencyBalance";
import tryParseCurrencyAmount from "lib/utils/tryParseCurrencyAmount";
import { useBag } from "nft/hooks/useBag";
import useDerivedPayWithAnyTokenSwapInfo from "nft/hooks/useDerivedPayWithAnyTokenSwapInfo";
import usePayWithAnyTokenSwap from "nft/hooks/usePayWithAnyTokenSwap";
import usePermit2Approval from "nft/hooks/usePermit2Approval";
import { useTokenInput } from "nft/hooks/useTokenInput";
import { useWalletBalance } from "nft/hooks/useWalletBalance";
import { BagStatus } from "nft/types";
import { ethNumberStandardFormatter, formatWeiToDecimal } from "nft/utils";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown } from "react-feather";
import { useToggleWalletModal } from "state/application/hooks";
import { InterfaceTrade, TradeState } from "state/routing/types";
import styled, { useTheme } from "styled-components/macro";
import { ThemedText } from "theme";
import { computeFiatValuePriceImpact } from "utils/computeFiatValuePriceImpact";
import { warningSeverity } from "utils/prices";
import { switchChain } from "utils/switchChain";
import shallow from "zustand/shallow";

const LOW_SEVERITY_THRESHOLD = 1;
const MEDIUM_SEVERITY_THRESHOLD = 3;

const FooterContainer = styled.div`
  padding: 0px 12px;
`;

const Footer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  margin: 0px 16px 8px;
  padding: 12px 0px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
`;

const FooterHeader = styled(Column)<{ usingPayWithAnyToken?: boolean }>`
  padding-top: 8px;
  padding-bottom: ${({ usingPayWithAnyToken }) =>
    usingPayWithAnyToken ? "16px" : "20px"};
`;

const CurrencyRow = styled(Row)`
  justify-content: space-between;
  align-items: start;
  gap: 8px;
`;

const TotalColumn = styled(Column)`
  text-align: end;
  overflow-x: hidden;
`;

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentWarning};
`;
const WarningText = styled(ThemedText.BodyPrimary)`
  align-items: center;
  color: ${({ theme }) => theme.accentWarning};
  display: flex;
  justify-content: center;
  margin-bottom: 10px !important;
  text-align: center;
`;

const HelperText = styled(ThemedText.Caption)<{ $color: string }>`
  color: ${({ $color }) => $color};
  display: flex;
  justify-content: center;
  text-align: center;
  margin-bottom: 10px !important;
`;

const CurrencyInput = styled(Row)`
  gap: 8px;
  cursor: pointer;
`;

const PayButton = styled.button<{ $backgroundColor: string; $color: string }>`
  display: flex;
  background: ${({ $backgroundColor }) => $backgroundColor};
  color: ${({ $color }) => $color};
  font-weight: 600;
  line-height: 24px;
  font-size: 16px;
  gap: 16px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 12px 0px;
  cursor: pointer;
  align-items: center;

  &:disabled {
    opacity: 0.6;
    cursor: auto;
  }
`;
const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 1rem;
  align-self: end;
`;
const PriceImpactContainer = styled(Row)`
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`;

const PriceImpactRow = styled(Row)`
  align-items: center;
  gap: 8px;
`;

const ValueText = styled(ThemedText.BodyPrimary)`
  line-height: 20px;
  font-weight: 500;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  scrollbar-width: none;

  ::-webkit-scrollbar {
    display: none;
  }
`;

interface ActionButtonProps {
  disabled?: boolean;
  onClick: () => void;
  backgroundColor: string;
  textColor: string;
}

const ActionButton = ({
  disabled,
  children,
  onClick,
  backgroundColor,
  textColor,
}: PropsWithChildren<ActionButtonProps>) => {
  return (
    <PayButton
      disabled={disabled}
      onClick={onClick}
      $backgroundColor={backgroundColor}
      $color={textColor}
    >
      {children}
    </PayButton>
  );
};

const Warning = ({ children }: PropsWithChildren<unknown>) => {
  if (!children) {
    return null;
  }
  return (
    <WarningText fontSize="14px" lineHeight="20px">
      <WarningIcon />
      {children}
    </WarningText>
  );
};

interface HelperTextProps {
  color: string;
}

const Helper = ({ children, color }: PropsWithChildren<HelperTextProps>) => {
  if (!children) {
    return null;
  }
  return (
    <HelperText lineHeight="16px" $color={color}>
      {children}
    </HelperText>
  );
};

const InputCurrencyValue = ({
  usingPayWithAnyToken,
  totalEthPrice,
  activeCurrency,
  tradeState,
  trade,
}: {
  usingPayWithAnyToken: boolean;
  totalEthPrice: BigNumber;
  activeCurrency: Currency | undefined | null;
  tradeState: TradeState;
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
}) => {
  if (!usingPayWithAnyToken) {
    return (
      <ThemedText.BodyPrimary lineHeight="20px" fontWeight="500">
        {formatWeiToDecimal(totalEthPrice.toString())}
        &nbsp;{activeCurrency?.symbol ?? "ETH"}
      </ThemedText.BodyPrimary>
    );
  }

  if (tradeState === TradeState.LOADING) {
    return (
      <ThemedText.BodyPrimary
        color="textTertiary"
        lineHeight="20px"
        fontWeight="500"
      >
        <Trans>Fetching price...</Trans>
      </ThemedText.BodyPrimary>
    );
  }

  return (
    <ValueText
      color={tradeState === TradeState.SYNCING ? "textTertiary" : "textPrimary"}
    >
      {ethNumberStandardFormatter(trade?.inputAmount.toExact())}
    </ValueText>
  );
};

const FiatValue = ({
  usdcValue,
  priceImpact,
  priceImpactColor,
  tradeState,
  usingPayWithAnyToken,
}: {
  usdcValue: CurrencyAmount<Token> | null;
  priceImpact: Percent | undefined;
  priceImpactColor: string | undefined;
  tradeState: TradeState;
  usingPayWithAnyToken: boolean;
}) => {
  if (!usdcValue) {
    if (
      usingPayWithAnyToken &&
      (tradeState === TradeState.INVALID ||
        tradeState === TradeState.NO_ROUTE_FOUND)
    ) {
      return null;
    }

    return <FiatLoadingBubble />;
  }

  return (
    <PriceImpactContainer>
      {priceImpact && priceImpactColor && (
        <>
          <MouseoverTooltip
            text={t`The estimated difference between the USD values of input and output amounts.`}
          >
            <PriceImpactRow>
              <AlertTriangle color={priceImpactColor} size="16px" />
              <ThemedText.BodySmall
                style={{ color: priceImpactColor }}
                lineHeight="20px"
              >
                (<Trans>{formatPriceImpact(priceImpact)}</Trans>)
              </ThemedText.BodySmall>
            </PriceImpactRow>
          </MouseoverTooltip>
        </>
      )}
      <ThemedText.BodySmall color="textTertiary" lineHeight="20px">
        {`${ethNumberStandardFormatter(usdcValue?.toExact(), true)}`}
      </ThemedText.BodySmall>
    </PriceImpactContainer>
  );
};

interface BagFooterProps {
  totalEthPrice: BigNumber;
  bagStatus: BagStatus;
  fetchAssets: () => void;
  eventProperties: Record<string, unknown>;
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
];

export const BagFooter = ({
  totalEthPrice,
  bagStatus,
  fetchAssets,
  eventProperties,
}: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal();
  const theme = useTheme();
  const { account, chainId, connector } = useWeb3React();
  const connected = Boolean(account && chainId);
  const shouldUsePayWithAnyToken = usePayWithAnyTokenEnabled();
  const inputCurrency = useTokenInput((state) => state.inputCurrency);
  const setInputCurrency = useTokenInput((state) => state.setInputCurrency);
  const defaultCurrency = useCurrency("ETH");
  const inputCurrencyBalance = useTokenBalance(
    account ?? undefined,
    !!inputCurrency && inputCurrency.isToken ? inputCurrency : undefined
  );

  const {
    isLocked: bagIsLocked,
    setBagExpanded,
    setBagStatus,
  } = useBag(
    ({ isLocked, setBagExpanded, setBagStatus }) => ({
      isLocked,
      setBagExpanded,
      setBagStatus,
    }),
    shallow
  );

  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false);

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus);
  const activeCurrency = inputCurrency ?? defaultCurrency;
  const usingPayWithAnyToken =
    !!inputCurrency &&
    shouldUsePayWithAnyToken &&
    chainId === SupportedChainId.MAINNET;

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(
      formatEther(totalEthPrice.toString()),
      defaultCurrency ?? undefined
    );
  }, [defaultCurrency, totalEthPrice]);
  const {
    state: tradeState,
    trade,
    maximumAmountIn,
    allowedSlippage,
  } = useDerivedPayWithAnyTokenSwapInfo(
    usingPayWithAnyToken ? inputCurrency : undefined,
    parsedOutputAmount
  );
  const { allowance, isAllowancePending, isApprovalLoading, updateAllowance } =
    usePermit2Approval(
      trade?.inputAmount.currency.isToken
        ? (trade?.inputAmount as CurrencyAmount<Token>)
        : undefined,
      maximumAmountIn,
      shouldUsePayWithAnyToken
    );
  usePayWithAnyTokenSwap(trade, allowance, allowedSlippage);

  const fiatValueTradeInput = useStablecoinValue(trade?.inputAmount);
  const fiatValueTradeOutput = useStablecoinValue(parsedOutputAmount);
  const usdcValue = usingPayWithAnyToken
    ? fiatValueTradeInput
    : fiatValueTradeOutput;
  const stablecoinPriceImpact = useMemo(
    () =>
      tradeState === TradeState.SYNCING || !trade
        ? undefined
        : computeFiatValuePriceImpact(
            fiatValueTradeInput,
            fiatValueTradeOutput
          ),
    [fiatValueTradeInput, fiatValueTradeOutput, tradeState, trade]
  );
  const { priceImpactWarning, priceImpactColor } = useMemo(() => {
    const severity = warningSeverity(stablecoinPriceImpact);

    if (severity < LOW_SEVERITY_THRESHOLD) {
      return { priceImpactWarning: false, priceImpactColor: undefined };
    }

    if (severity < MEDIUM_SEVERITY_THRESHOLD) {
      return {
        priceImpactWarning: false,
        priceImpactColor: theme.accentWarning,
      };
    }

    return { priceImpactWarning: true, priceImpactColor: theme.accentCritical };
  }, [stablecoinPriceImpact, theme.accentCritical, theme.accentWarning]);

  const { balance: balanceInEth } = useWalletBalance();
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined;
    }

    if (inputCurrency) {
      const inputAmount = trade?.inputAmount;

      if (!inputCurrencyBalance || !inputAmount) {
        return undefined;
      }

      return !inputCurrencyBalance.lessThan(inputAmount);
    }

    return parseEther(balanceInEth).gte(totalEthPrice);
  }, [
    connected,
    chainId,
    inputCurrency,
    balanceInEth,
    totalEthPrice,
    trade?.inputAmount,
    inputCurrencyBalance,
  ]);

  useEffect(() => {
    setBagStatus(BagStatus.ADDING_TO_BAG);
  }, [inputCurrency, setBagStatus]);

  const {
    buttonText,
    buttonTextColor,
    disabled,
    warningText,
    helperText,
    helperTextColor,
    handleClick,
    buttonColor,
  } = useMemo(() => {
    let handleClick = fetchAssets;
    let buttonText = <Trans>Something went wrong</Trans>;
    let disabled = true;
    let warningText = undefined;
    let helperText = undefined;
    let helperTextColor = theme.textSecondary;
    let buttonColor = theme.accentAction;
    let buttonTextColor = theme.accentTextLightPrimary;

    if (connected && chainId !== SupportedChainId.MAINNET) {
      handleClick = () => switchChain(connector, SupportedChainId.MAINNET);
      buttonText = <Trans>Switch networks</Trans>;
      disabled = false;
      warningText = <Trans>Wrong network</Trans>;
    } else if (sufficientBalance === false) {
      buttonText = <Trans>Pay</Trans>;
      disabled = true;
      warningText = <Trans>Insufficient funds</Trans>;
    } else if (bagStatus === BagStatus.WARNING) {
      warningText = <Trans>Something went wrong. Please try again.</Trans>;
    } else if (!connected) {
      handleClick = () => {
        toggleWalletModal();
        setBagExpanded({ bagExpanded: false });
      };
      disabled = false;
      buttonText = <Trans>Connect wallet</Trans>;
    } else if (usingPayWithAnyToken && tradeState !== TradeState.VALID) {
      disabled = true;
      buttonText = <Trans>Fetching Route</Trans>;

      if (tradeState === TradeState.INVALID) {
        buttonText = <Trans>Pay</Trans>;
      }

      if (tradeState === TradeState.NO_ROUTE_FOUND) {
        buttonText = <Trans>Insufficient liquidity</Trans>;
        buttonColor = theme.backgroundInteractive;
        buttonTextColor = theme.textPrimary;
        helperText = (
          <Trans>Insufficient pool liquidity to complete transaction</Trans>
        );
      }
    } else if (
      allowance.state === AllowanceState.REQUIRED ||
      allowance.state === AllowanceState.LOADING
    ) {
      handleClick = () => updateAllowance();
      disabled =
        isAllowancePending ||
        isApprovalLoading ||
        allowance.state === AllowanceState.LOADING;

      if (allowance.state === AllowanceState.LOADING) {
        buttonText = <Trans>Loading Allowance</Trans>;
      } else if (isAllowancePending) {
        buttonText = <Trans>Approve in your wallet</Trans>;
      } else if (isApprovalLoading) {
        buttonText = <Trans>Approval pending</Trans>;
      } else {
        helperText = <Trans>An approval is needed to use this token. </Trans>;
        buttonText = <Trans>Approve</Trans>;
      }
    } else if (
      bagStatus === BagStatus.FETCHING_FINAL_ROUTE ||
      bagStatus === BagStatus.CONFIRMING_IN_WALLET
    ) {
      disabled = true;
      buttonText = <Trans>Proceed in wallet</Trans>;
    } else if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      disabled = true;
      buttonText = <Trans>Transaction pending</Trans>;
    } else if (priceImpactWarning && priceImpactColor) {
      disabled = false;
      buttonColor = priceImpactColor;
      helperText = <Trans>Price impact warning</Trans>;
      helperTextColor = priceImpactColor;
      buttonText = <Trans>Pay Anyway</Trans>;
    } else if (sufficientBalance === true) {
      disabled = false;
      buttonText = <Trans>Pay</Trans>;
      helperText = usingPayWithAnyToken ? (
        <Trans>Refunds for unavailable items will be given in ETH</Trans>
      ) : undefined;
    }

    return {
      buttonText,
      buttonTextColor,
      disabled,
      warningText,
      helperText,
      helperTextColor,
      handleClick,
      buttonColor,
    };
  }, [
    fetchAssets,
    theme.textSecondary,
    theme.accentAction,
    theme.accentTextLightPrimary,
    theme.backgroundInteractive,
    theme.textPrimary,
    connected,
    chainId,
    sufficientBalance,
    bagStatus,
    usingPayWithAnyToken,
    tradeState,
    allowance.state,
    priceImpactWarning,
    priceImpactColor,
    connector,
    toggleWalletModal,
    setBagExpanded,
    isAllowancePending,
    isApprovalLoading,
    updateAllowance,
  ]);

  const traceEventProperties = {
    usd_value: usdcValue?.toExact(),
    ...eventProperties,
  };

  return (
    <FooterContainer>
      <Footer>
        {shouldUsePayWithAnyToken && (
          <FooterHeader
            gap="xs"
            usingPayWithAnyToken={shouldUsePayWithAnyToken}
          >
            <CurrencyRow>
              <Column gap="xs">
                <ThemedText.SubHeaderSmall>
                  <Trans>Pay with</Trans>
                </ThemedText.SubHeaderSmall>
                <CurrencyInput
                  onClick={() =>
                    bagIsLocked ? undefined : setTokenSelectorOpen(true)
                  }
                >
                  <CurrencyLogo currency={activeCurrency} size="24px" />
                  <ThemedText.HeadlineSmall fontWeight={500} lineHeight="24px">
                    {activeCurrency?.symbol}
                  </ThemedText.HeadlineSmall>
                  <ChevronDown size={20} color={theme.textSecondary} />
                </CurrencyInput>
              </Column>
              <TotalColumn gap="xs">
                <ThemedText.SubHeaderSmall marginBottom="4px">
                  <Trans>Total</Trans>
                </ThemedText.SubHeaderSmall>
                <InputCurrencyValue
                  usingPayWithAnyToken={usingPayWithAnyToken}
                  totalEthPrice={totalEthPrice}
                  activeCurrency={activeCurrency}
                  tradeState={tradeState}
                  trade={trade}
                />
              </TotalColumn>
            </CurrencyRow>
            <FiatValue
              usdcValue={usdcValue}
              priceImpact={stablecoinPriceImpact}
              priceImpactColor={priceImpactColor}
              tradeState={tradeState}
              usingPayWithAnyToken={usingPayWithAnyToken}
            />
          </FooterHeader>
        )}
        {!shouldUsePayWithAnyToken && (
          <FooterHeader gap="xs">
            <Row justify="space-between">
              <div>
                <ThemedText.HeadlineSmall>Total</ThemedText.HeadlineSmall>
              </div>
              <div>
                <ThemedText.HeadlineSmall>
                  {formatWeiToDecimal(totalEthPrice.toString())}
                  &nbsp;{activeCurrency?.symbol ?? "ETH"}
                </ThemedText.HeadlineSmall>
              </div>
            </Row>
            <FiatValue
              usdcValue={usdcValue}
              priceImpact={stablecoinPriceImpact}
              priceImpactColor={priceImpactColor}
              tradeState={tradeState}
              usingPayWithAnyToken={usingPayWithAnyToken}
            />
          </FooterHeader>
        )}
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={{ ...traceEventProperties }}
          shouldLogImpression={connected && !disabled}
        >
          <Warning>{warningText}</Warning>
          <Helper color={helperTextColor}>{helperText}</Helper>
          <ActionButton
            onClick={handleClick}
            disabled={disabled}
            backgroundColor={buttonColor}
            textColor={buttonTextColor}
          >
            {isPending && <Loader size="20px" stroke="white" />}
            {buttonText}
          </ActionButton>
        </TraceEvent>
      </Footer>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={(currency: Currency) =>
          setInputCurrency(currency.isNative ? undefined : currency)
        }
        selectedCurrency={activeCurrency ?? undefined}
        onlyShowCurrenciesWithBalance={true}
      />
    </FooterContainer>
  );
};
