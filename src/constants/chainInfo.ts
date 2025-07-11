import celoCircleLogoUrl from "assets/images/celoCircle.png";
import ethereumLogoUrl from "assets/images/ethereum-logo.png";
import polygonCircleLogoUrl from "assets/images/polygonCircle.png";
import {
  default as arbitrumCircleLogoUrl,
  default as arbitrumLogoUrl,
} from "assets/svg/arbitrum_logo.svg";
import celoLogo from "assets/svg/celo_logo.svg";
import optimismLogoUrl from "assets/svg/optimistic_ethereum.svg";
import polygonMaticLogo from "assets/svg/polygon-matic-logo.svg";
import ms from "ms.macro";
import { darkTheme } from "theme/colors";

import {
  SupportedChainId,
  SupportedL1ChainId,
  SupportedL2ChainId,
} from "./chains";
import { ARBITRUM_LIST, CELO_LIST, OPTIMISM_LIST } from "./lists";

export const AVERAGE_L1_BLOCK_TIME = ms`12s`;

export enum NetworkType {
  L1,
  L2,
}
interface BaseChainInfo {
  readonly networkType: NetworkType;
  readonly blockWaitMsBeforeWarning?: number;
  readonly docs: string;
  readonly bridge?: string;
  readonly explorer: string;
  readonly infoLink: string;
  readonly logoUrl: string;
  readonly circleLogoUrl?: string;
  readonly label: string;
  readonly helpCenterUrl?: string;
  readonly nativeCurrency: {
    name: string; // e.g. 'Goerli ETH',
    symbol: string; // e.g. 'gorETH',
    decimals: number; // e.g. 18,
  };
  readonly color?: string;
  readonly backgroundColor?: string;
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1;
  readonly defaultListUrl?: string;
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L2;
  readonly bridge: string;
  readonly statusPage?: string;
  readonly defaultListUrl: string;
}

type ChainInfoMap = {
  readonly [chainId: number]: L1ChainInfo | L2ChainInfo;
} & {
  readonly [chainId in SupportedL2ChainId]: L2ChainInfo;
} & { readonly [chainId in SupportedL1ChainId]: L1ChainInfo };

const CHAIN_INFO: ChainInfoMap = {
  [SupportedChainId.MAINNET]: {
    networkType: NetworkType.L1,
    docs: "https://docs.uniswap.org/",
    explorer: "https://etherscan.io/",
    infoLink: "https://info.uniswap.org/#/",
    label: "Ethereum",
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    color: darkTheme.chain_1,
  },
  [SupportedChainId.RINKEBY]: {
    networkType: NetworkType.L1,
    docs: "https://docs.uniswap.org/",
    explorer: "https://rinkeby.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/",
    label: "Rinkeby",
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: "Rinkeby Ether", symbol: "rETH", decimals: 18 },
    color: darkTheme.chain_4,
  },
  [SupportedChainId.ROPSTEN]: {
    networkType: NetworkType.L1,
    docs: "https://docs.uniswap.org/",
    explorer: "https://ropsten.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/",
    label: "Ropsten",
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: "Ropsten Ether", symbol: "ropETH", decimals: 18 },
    color: darkTheme.chain_3,
  },
  [SupportedChainId.KOVAN]: {
    networkType: NetworkType.L1,
    docs: "https://docs.uniswap.org/",
    explorer: "https://kovan.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/",
    label: "Kovan",
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: "Kovan Ether", symbol: "kovETH", decimals: 18 },
    color: darkTheme.chain_420,
  },
  [SupportedChainId.GOERLI]: {
    networkType: NetworkType.L1,
    docs: "https://docs.uniswap.org/",
    explorer: "https://goerli.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/",
    label: "Görli",
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: "Görli Ether", symbol: "görETH", decimals: 18 },
    color: darkTheme.chain_5,
  },
  [SupportedChainId.OPTIMISM]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`25m`,
    bridge: "https://app.optimism.io/bridge",
    defaultListUrl: OPTIMISM_LIST,
    docs: "https://optimism.io/",
    explorer: "https://optimistic.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/optimism/",
    label: "Optimism",
    logoUrl: optimismLogoUrl,
    // Optimism perfers same icon for both
    circleLogoUrl: optimismLogoUrl,
    statusPage: "https://optimism.io/status",
    helpCenterUrl:
      "https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    color: darkTheme.chain_10,
    backgroundColor: darkTheme.chain_10_background,
  },
  [SupportedChainId.OPTIMISM_GOERLI]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`25m`,
    bridge: "https://app.optimism.io/bridge",
    defaultListUrl: OPTIMISM_LIST,
    docs: "https://optimism.io/",
    explorer: "https://goerli-optimism.etherscan.io/",
    infoLink: "https://info.uniswap.org/#/optimism/",
    label: "Optimism Görli",
    logoUrl: optimismLogoUrl,
    statusPage: "https://optimism.io/status",
    helpCenterUrl:
      "https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ",
    nativeCurrency: {
      name: "Optimism Goerli Ether",
      symbol: "görOpETH",
      decimals: 18,
    },
    color: darkTheme.chain_420,
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://arbiscan.io/",
    infoLink: "https://info.uniswap.org/#/arbitrum",
    label: "Arbitrum",
    logoUrl: arbitrumLogoUrl,
    circleLogoUrl: arbitrumCircleLogoUrl,
    defaultListUrl: ARBITRUM_LIST,
    helpCenterUrl:
      "https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    color: darkTheme.chain_42,
    backgroundColor: darkTheme.chain_42161_background,
  },
  [SupportedChainId.ARBITRUM_RINKEBY]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://rinkeby-explorer.arbitrum.io/",
    infoLink: "https://info.uniswap.org/#/arbitrum/",
    label: "Arbitrum Rinkeby",
    logoUrl: arbitrumLogoUrl,
    defaultListUrl: ARBITRUM_LIST,
    helpCenterUrl:
      "https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum",
    nativeCurrency: {
      name: "Rinkeby Arbitrum Ether",
      symbol: "rinkArbETH",
      decimals: 18,
    },
    color: darkTheme.chain_421611,
  },
  [SupportedChainId.POLYGON]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://wallet.polygon.technology/login",
    docs: "https://polygon.io/",
    explorer: "https://polygonscan.com/",
    infoLink: "https://info.uniswap.org/#/polygon/",
    label: "Polygon",
    logoUrl: polygonMaticLogo,
    circleLogoUrl: polygonCircleLogoUrl,
    nativeCurrency: { name: "Polygon Matic", symbol: "MATIC", decimals: 18 },
    color: darkTheme.chain_137,
    backgroundColor: darkTheme.chain_137_background,
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://wallet.polygon.technology/bridge",
    docs: "https://polygon.io/",
    explorer: "https://mumbai.polygonscan.com/",
    infoLink: "https://info.uniswap.org/#/polygon/",
    label: "Polygon Mumbai",
    logoUrl: polygonMaticLogo,
    nativeCurrency: {
      name: "Polygon Mumbai Matic",
      symbol: "mMATIC",
      decimals: 18,
    },
  },
  [SupportedChainId.CELO]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://www.portalbridge.com/#/transfer",
    docs: "https://docs.celo.org/",
    explorer: "https://celoscan.io/",
    infoLink: "https://info.uniswap.org/#/celo",
    label: "Celo",
    logoUrl: celoLogo,
    circleLogoUrl: celoCircleLogoUrl,
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [SupportedChainId.CELO_ALFAJORES]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: "https://www.portalbridge.com/#/transfer",
    docs: "https://docs.celo.org/",
    explorer: "https://alfajores-blockscout.celo-testnet.org/",
    infoLink: "https://info.uniswap.org/#/celo",
    label: "Celo Alfajores",
    logoUrl: celoLogo,
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [SupportedChainId.PNC]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: "https://docs.pnc.network/",
    explorer: "http://43.156.127.203:8080/",
    infoLink: "http://43.156.127.203:8080/",
    label: "PNC",
    logoUrl:
      "https://explorer.testnet9.waterfall.network/favicon-152-precomposed.png",
    nativeCurrency: { name: "PNC", symbol: "PNC", decimals: 18 },
  },
};

export function getChainInfo(chainId: SupportedL1ChainId): L1ChainInfo;
export function getChainInfo(chainId: SupportedL2ChainId): L2ChainInfo;
export function getChainInfo(
  chainId: SupportedChainId
): L1ChainInfo | L2ChainInfo;
export function getChainInfo(
  chainId:
    | SupportedChainId
    | SupportedL1ChainId
    | SupportedL2ChainId
    | number
    | undefined
): L1ChainInfo | L2ChainInfo | undefined;

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * SupportedChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(chainId: any): any {
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined;
  }
  return undefined;
}

const MAINNET_INFO = CHAIN_INFO[SupportedChainId.MAINNET];
export function getChainInfoOrDefault(chainId: number | undefined) {
  return getChainInfo(chainId) ?? MAINNET_INFO;
}
