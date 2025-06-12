import type { TokenList } from "@uniswap/token-lists";
import { validateTokenList } from "@uniswap/widgets";
import contenthashToUri from "lib/utils/contenthashToUri";
import parseENSAddress from "lib/utils/parseENSAddress";
import uriToHttp from "lib/utils/uriToHttp";

export const DEFAULT_TOKEN_LIST =
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org";

const listCache = new Map<string, TokenList>();

/** Fetches and validates a token list. */
export default async function fetchTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>,
  skipValidation?: boolean
): Promise<TokenList> {
  const cached = listCache?.get(listUrl); // avoid spurious re-fetches
  if (cached) {
    return cached;
  }

  let urls: string[];
  const parsedENS = parseENSAddress(listUrl);
  if (parsedENS) {
    let contentHashUri;
    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName);
    } catch (error) {
      const message = `failed to resolve ENS name: ${parsedENS.ensName}`;
      console.debug(message, error);
      throw new Error(message);
    }
    let translatedUri;
    try {
      translatedUri = contenthashToUri(contentHashUri);
    } catch (error) {
      const message = `failed to translate contenthash to URI: ${contentHashUri}`;
      console.debug(message, error);
      throw new Error(message);
    }
    urls = uriToHttp(`${translatedUri}${parsedENS.ensPath ?? ""}`);
  } else {
    urls = uriToHttp(listUrl);
  }

  // for (let i = 0; i < urls.length; i++) {
  //   const url = urls[i]
  //   const isLast = i === urls.length - 1
  //   let response
  //   try {
  //     console.log("===========>", url);
  //     response = await fetch(url, { credentials: 'omit' })
  //     console.log(response);
  //   } catch (error) {
  //     const message = `failed to fetch list: ${listUrl}`
  //     console.debug(message, error)
  //     if (isLast) throw new Error(message)
  //     continue
  //   }

  //   if (!response.ok) {
  //     const message = `failed to fetch list: ${listUrl}`
  //     console.debug(message, response.statusText)
  //     if (isLast) throw new Error(message)
  //     continue
  //   }

  //   const json = await response.json()
  //   const list = skipValidation ? json : await validateTokenList(json)
  //   listCache?.set(listUrl, list)
  //   return list
  // }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let response;

    // Check if this is the problematic URL
    if (url === "https://strikeio.com/Upload/public/pnc_token.json") {
      // Use the hard-coded JSON instead of fetching
      const hardcodedTokenList = {
        name: "PNC Token List",
        timestamp: "2024-08-27T09:23:13.NZ",
        keywords: ["null"],
        logoURI: "ipfs://QmQAGtNJ2rSGpnP6dh6PPKNSmZL8RTZXmgFwgTdy5Nz5mx",
        version: { major: 5, minor: 0, patch: 0 },
        tokens: [
          {
            chainId: 31580102030,
            name: "FLCT",
            address: "0x1929D77aA7AcdC3E2624BfaBc7f94A4593C858e0",
            decimals: 5,
            symbol: "FLCT",
            logoURI:
              "https://flct-1319989102.cos.ap-singapore.myqcloud.com/static/upload/token/flct.png",
          },
          {
            chainId: 31580102030,
            name: "CNYT",
            address: "0x82f74Fd9F2e4A8b23CC2C6E67E39049216DdCD42",
            decimals: 5,
            symbol: "CNYT",
            logoURI:
              "https://flct-1319989102.cos.ap-singapore.myqcloud.com/static/upload/token/net.png",
          },
          {
            chainId: 31580102030,
            name: "USDK",
            address: "0x2ab0F4D16004B4E5766F77AEa56952aB5751698C",
            decimals: 5,
            symbol: "USDK",
            logoURI:
              "http://flct-1319989102.cos.accelerate.myqcloud.com/token/script/group1/default/20230724/14/06/4/0a53fe02a9d21bc59b17b40f4a356174.png",
          },
          {
            chainId: 31580102030,
            name: "TOKEN1",
            address: "0x3309B3491f1EBB200aDD635b7359442BF1D34b1d",
            decimals: 18,
            symbol: "TOKEN1",
            logoURI:
              "http://flct-1319989102.cos.accelerate.myqcloud.com/token/script/group1/default/20230724/14/06/4/0a53fe02a9d21bc59b17b40f4a356174.png",
          },
          {
            chainId: 31580102030,
            name: "TOKEN2",
            address: "0x983c156C3090417Ac0542B17D29a76A068136424",
            decimals: 18,
            symbol: "TOKEN2",
            logoURI:
              "http://flct-1319989102.cos.accelerate.myqcloud.com/token/script/group1/default/20230724/14/06/4/0a53fe02a9d21bc59b17b40f4a356174.png",
          },
        ],
      };

      const list = hardcodedTokenList;
      listCache?.set(listUrl, hardcodedTokenList);
      return list;
    }

    // Original code for other URLs
    try {
      response = await fetch(url, { credentials: "omit" });
    } catch (error) {
      console.debug(`failed to fetch list: ${listUrl} (${url})`, error);
      continue;
    }

    // Rest of your original code...
    if (!response.ok) {
      console.debug(
        `failed to fetch list ${listUrl} (${url})`,
        response.statusText
      );
      continue;
    }

    try {
      const json = await response.json();
      const list = skipValidation ? json : await validateTokenList(json);
      listCache?.set(listUrl, list);
      return list;
    } catch (error) {
      console.debug(
        `failed to parse and validate list response: ${listUrl} (${url})`,
        error
      );
      continue;
    }
  }

  console.log("2222222222222", listCache);

  throw new Error("Unrecognized list URL protocol.");
}
