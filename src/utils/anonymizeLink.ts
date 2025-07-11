const EXPLORER_HOSTNAMES: { [hostname: string]: true } = {
  "etherscan.io": true,
  "ropsten.etherscan.io": true,
  "rinkeby.etherscan.io": true,
  "kovan.etherscan.io": true,
  "goerli.etherscan.io": true,
  "optimistic.etherscan.io": true,
  "goerli-optimism.etherscan.io": true,
  "rinkeby-explorer.arbitrum.io": true,
  "arbiscan.io": true,
  "43.156.127.203:8080": true,
};

/**
 * Returns the anonymized version of the given href, i.e. one that does not leak user information
 * @param href the link to anonymize, i.e. remove any personal data from
 * @return string anonymized version of the given href
 */
export function anonymizeLink(href: string): string {
  try {
    const url = new URL(href);
    if (EXPLORER_HOSTNAMES[url.hostname]) {
      const pathPieces = url.pathname.split("/");

      const anonymizedPath = pathPieces
        .map((pc) => (/0x[a-fA-F0-9]+/.test(pc) ? "***" : pc))
        .join("/");

      return `${url.protocol}//${url.hostname}${anonymizedPath}`;
    }
    return href;
  } catch (error) {
    return href;
  }
}
