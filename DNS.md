# DNS for thingelstad.xyz

The `thingelstad.xyz` zone is a Route 53 hosted zone, and every record in it is code in the `dns-thingelstad-xyz` CloudFormation stack: `config/dns-thingelstad-xyz-stack.yaml` in `projects-sysadmin`. DNS moved there from Namecheap BasicDNS on October 27, 2026. Namecheap is still the registrar, and Jamie's lever to point the name servers back if AWS is ever unavailable, but it no longer serves the zone. The move's plan and status are in `projects-sysadmin/docs/DNS-MIGRATION.md`.

A record is changed by a pull request to that stack and a deploy, never in the Route 53 console and never at Namecheap. A site stack may own its own records where that is natural (an ACM certificate's `DomainValidationOptions` with `HostedZoneId`); until that follow-up lands, the record stays in the zone stack. The zone has no mail; if it ever gets mail records (MX, SPF, DKIM, DMARC, verification TXT), they change only with Jamie's approval line.

## This site's records

All of these are in the zone stack.

| Type    | Name                                    | Value                                                              |
| ------- | --------------------------------------- | ------------------------------------------------------------------ |
| A, AAAA | apex                                    | alias to `d34njoaumjumim.cloudfront.net`                           |
| CNAME   | `www`                                   | `d34njoaumjumim.cloudfront.net`                                    |
| CNAME   | `_fda64cb6192085deb8ef9ed397bb70cd`     | `_a454fe38f4f0fad84b1c46c7810fd29a.wzccmgtwzk.acm-validations.aws` |
| CNAME   | `_cf193c77ededbed618e96a9876398376.www` | `_5c94a4067e45ab48ec540df231559efb.wzccmgtwzk.acm-validations.aws` |
| TXT     | apex                                    | ENS (`ENS1 dnsname.ens.eth ...`) and `google-site-verification`    |
| TXT     | `_ens`                                  | `a=0x2BdA946a7740b1dDB0fd5C226819170c4DD15720`                     |

Keep both ACM CNAMEs for automatic renewal. Certificate ARN: `arn:aws:acm:us-east-1:999153317627:certificate/15e8b7f8-91c7-433a-8618-9cbf2498baf5`. Do not pin CloudFront's transient addresses in fixed A/AAAA records. The former `jamie` ENS TXT record is absent; restore it (in the zone stack) only if that ENS subdomain is wanted again.

The zone also holds the records for the other `thingelstad.xyz` sites (`sync`, `links`, `poap`, `nnxyz`), which their own repositories describe.

## DNSSEC

Jamie turned DNSSEC off at Namecheap on October 27, 2026, before the move. The .xyz registry kept the old DS after Namecheap stopped signing, so validating resolvers failed for the site for up to an hour (about 3:50 to 4:50 PM Central). Route 53 signing is the zone stack's `Signing` parameter, turned on once the zone has answered cleanly for a day, after which Jamie adds the DS at Namecheap. See `DNS-MIGRATION.md` for the safe order.

## History

- October 13, 2026: moved from Google's DNS to Namecheap BasicDNS with DNSSEC; both HTTPS names, the ACM certificate and desktop and phone browsing verified that day.
- October 17, 2026: the guide and its `/api/*` routes were retired; no DNS record changed.
- October 27, 2026: moved from Namecheap BasicDNS to Route 53 (`dns-thingelstad-xyz`).
