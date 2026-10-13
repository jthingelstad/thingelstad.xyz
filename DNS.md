# Namecheap DNS for thingelstad.xyz

Jamie selected Namecheap BasicDNS. Enter the relative **Host** values below in Advanced DNS; Namecheap appends `thingelstad.xyz`. Use TTL 5 minutes where available. DNS changes are made by Jamie.

## Required website records

| Type  | Host  | Value                           |
| ----- | ----- | ------------------------------- |
| ALIAS | `@`   | `d34njoaumjumim.cloudfront.net` |
| CNAME | `www` | `d34njoaumjumim.cloudfront.net` |

Do not pin CloudFront's transient addresses in fixed A/AAAA records or leave parking/redirect records at these hosts.

## Required HTTPS validation records

| Type  | Host                                    | Value                                                              |
| ----- | --------------------------------------- | ------------------------------------------------------------------ |
| CNAME | `_fda64cb6192085deb8ef9ed397bb70cd`     | `_a454fe38f4f0fad84b1c46c7810fd29a.wzccmgtwzk.acm-validations.aws` |
| CNAME | `_cf193c77ededbed618e96a9876398376.www` | `_5c94a4067e45ab48ec540df231559efb.wzccmgtwzk.acm-validations.aws` |

Keep both CNAMEs for automatic renewal. Certificate ARN: `arn:aws:acm:us-east-1:999153317627:certificate/15e8b7f8-91c7-433a-8618-9cbf2498baf5`.

## Existing TXT records

The Google zone screenshot showed these values. Preserve them unless intentionally retiring their respective functions.

| Type | Host    | Value                                                                  |
| ---- | ------- | ---------------------------------------------------------------------- |
| TXT  | `_ens`  | `a=0x2BdA946a7740b1dDB0fd5C226819170c4DD15720`                         |
| TXT  | `@`     | `ENS1 dnsname.ens.eth 0x2bda946a7740b1ddb0fd5c226819170c4dd15720`      |
| TXT  | `jamie` | `ENS1 dnsname.ens.eth 0x2bda946a7740b1ddb0fd5c226819170c4dd15720`      |
| TXT  | `@`     | `google-site-verification=mhFW5IUY8ZUu-kzEZvichOT_poRsBwgvmH9XHLoo1-Q` |

Google's NS/SOA records should not be copied. Namecheap supplies its own.

## DNSSEC and delegation

The registrar's nameserver choice must be Namecheap BasicDNS, delegating to `dns1.registrar-servers.com` and `dns2.registrar-servers.com`. The old Google DS (key tag 16595, algorithm 8) must not remain as the only DS once Namecheap's keys serve the domain. Namecheap BasicDNS manages its own DNSSEC records automatically; do not reuse the old Google key. Keep the Google zone intact until the cutover is verified.

Sources: [Namecheap BasicDNS](https://www.namecheap.com/support/knowledgebase/article.aspx/782/10/how-do-i-set-my-domain-to-use-namecheap-basicdns/), [Namecheap DNSSEC](https://www.namecheap.com/support/knowledgebase/article.aspx/9723/2232/managing-dnssec-for-domains-pointed-to-premium-or-basicdns/).

## Verification snapshot: October 13, 2026, 11:25 AM Central

- All three queried .xyz parent servers delegate to Namecheap and publish its DS: key tag 16725, algorithm 13, SHA-256.
- Google and Cloudflare public resolvers return DNSSEC-authenticated apex A/AAAA records and www CNAME records.
- Both ACM CNAMEs resolve publicly and the certificate is ISSUED.
- CloudFront has both custom aliases and the ACM certificate with TLSv1.2_2021. The distribution is Deployed and the site stack is UPDATE_COMPLETE.
- Both HTTPS domains return 200 with valid TLS. Browser checks pass at actual 1536px and 390px widths: all 49 graph nodes, project navigation, index and guide privacy copy, with no console or page errors.
- Read-only API health, refusal before quota/model invocation, and blocked private source paths pass on both domains. No public model invocation was made.
- Apex ENS/Google verification and _ens TXT records remain present. The former jamie TXT record is absent; restore only if retaining that ENS subdomain.

The Google validation and www CNAME records can remain during cache expiration. The apex is served through Namecheap, so no Google ALIAS is needed. Keep the Namecheap validation CNAMEs for automatic certificate renewal.
