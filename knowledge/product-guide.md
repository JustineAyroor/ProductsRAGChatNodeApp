# Internal Product Guide

## Return and Refund Policy

All SaaS subscriptions can be cancelled within 14 days of purchase for a full refund. Enterprise contracts (annual) require manager approval for refunds after the 14-day window. Refunds are processed within 5–7 business days.

## Support Tiers

- **Basic**: Email support, response within 48 hours (business days).
- **Pro**: Email + chat support, response within 24 hours.
- **Enterprise**: 24/7 phone and chat, dedicated account manager, 1-hour SLA for critical issues.

## Employee Discount Program

Internal employees receive 20% off any personal subscription. Use code `EMPLOYEE20` at checkout. Not combinable with other promotions.

## Data Export and Deletion

Customers can export all data via the Admin Console under Settings > Data Management. Full account deletion requests are processed within 30 days per GDPR requirements. Enterprise customers may request expedited deletion (7 days).

## Onboarding Process

1. Account provisioning (1 business day)
2. Kickoff call with Customer Success (30 min)
3. Technical integration review (if applicable)
4. Go-live confirmation email

Enterprise customers receive a dedicated onboarding specialist. Basic tier customers use self-service guides in the Help Center.

## Common Troubleshooting

### SSO Login Failures

Verify the IdP metadata URL is current. SAML certificates expire annually — check Admin Console > Security > SSO for expiry date. OAuth redirect URIs must match exactly (including trailing slashes).

### API Rate Limit Errors

Default rate limit is 100 requests/minute per API key. Enterprise plans can request increases up to 10,000 req/min. Contact support with your account ID.

### Billing Disputes

Escalate to the Billing team via internal Slack channel `#billing-escalations`. Include customer account ID and invoice number.
