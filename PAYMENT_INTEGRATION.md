# Uganda Mobile Money Payment Integration Guide

VENDRA integrates with Ugandan Mobile Money payment rails (MTN Mobile Money and Airtel Money Uganda). This document outlines the technical workflow, webhook specifications, and verification mechanisms.

---

## 1. Supported Providers

| Provider | Country Code | Phone Prefix Examples | USSD Fallback Code |
| :--- | :--- | :--- | :--- |
| **MTN Mobile Money** | +256 (UG) | 077x, 078x, 076x | `*165*8#` (My Approvals) |
| **Airtel Money** | +256 (UG) | 070x, 075x, 074x | `*185#` |

---

## 2. Recharge / Deposit Flow

1. **User Request**: User specifies an amount (Minimum: UGX 10,000) and selects MTN MoMo or Airtel Money.
2. **Pending Transaction Creation**: The server creates a pending deposit record in `deposits` and a pending entry in `transactions` with reference format `DEP-[TIMESTAMP]-[RAND]`.
3. **Gateway Dispatch**: The server communicates with the aggregator/operator endpoint to dispatch a USSD push request to the subscriber's phone.
4. **User PIN Authorization**: The subscriber is prompted on their handset to enter their 4- or 5-digit Mobile Money PIN.
5. **Webhook Callback**: The operator sends a POST request to `https://your-domain.com/api/webhooks/momo` containing the transaction status and the external transaction ID.
6. **Signature Verification**: VENDRA verifies the `x-vendra-signature` header using `HMAC-SHA256(payload, MOMO_WEBHOOK_SECRET)`.
7. **Ledger Credit**: Upon verified success, the transaction in `transactions` is updated to `SUCCESSFUL`, crediting the user's available balance.

---

## 3. Webhook Specification

### Endpoint
`POST /api/webhooks/momo`

### Headers
```http
Content-Type: application/json
x-vendra-signature: <hex_encoded_hmac_sha256_hash>
```

### Request Body
```json
{
  "reference": "DEP-1772990000000-421",
  "status": "SUCCESSFUL",
  "external_transaction_id": "MOMO-UG-20260906-892182",
  "amount": 25000,
  "currency": "UGX",
  "provider": "MTN_MOMO",
  "phone": "+256771234567"
}
```

### Response
```json
{ "received": true }
```

---

## 4. Sandbox Testing & Simulation

When `MOMO_ENVIRONMENT=sandbox` is configured in `.env`, developers and QA testers can simulate an immediate operator confirmation using the endpoint:

`POST /api/deposits/:reference/simulate-success` (Bearer Token required)

This triggers the complete ledger validation pipeline identically to a real incoming operator webhook.
