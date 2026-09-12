# VENDRA Administrator Operations Guide

This guide details procedures for managing withdrawals, configuring investment equipment products, adjusting platform fee thresholds, reviewing audit logs, and answering customer support tickets.

---

## 1. Accessing the Admin Console

1. Navigate to the **Mine** tab in the bottom navigation.
2. Sign in with the administrator account:
   - **Phone**: `+256700000001`
   - **Password**: `AdminPassword123!`
3. Click the **Admin Management Suite** banner at the top of the screen to open the administration console.

---

## 2. Withdrawal Approval Workflow

Every withdrawal submitted by a user enters the queue with status `PENDING`. Funds are reserved immediately from the user's available balance at submission time to ensure no user can double-spend.

### Action Options:

1. **Approve (`approve`)**:
   - Moves status to `APPROVED`.
   - Used when initial compliance and account checks pass and the transaction is forwarded to the payment operations team or automated disbursement gateway.
   - User receives an in-app notification indicating approval.

2. **Mark as Paid (`mark_paid`)**:
   - **Requirement**: Must supply the confirmed Mobile Money payment reference (e.g., `MM-PAY-849201`).
   - Moves status to `PAID`.
   - Converts the ledger reserve into `WITHDRAWAL_COMPLETED` with status `SUCCESSFUL`.
   - Permanent record is archived into the audit trail.

3. **Reject (`reject`)**:
   - Moves status to `REJECTED`.
   - Automatically issues a `WITHDRAWAL_REFUND` ledger transaction, immediately returning the reserved funds to the user's available balance.
   - Administrator must provide a clear rejection note (e.g. "Name on Mobile Money account does not match NIN registration").

4. **Require Verification (`require_verification`)**:
   - Moves status to `REQUIRES_VERIFICATION`.
   - Pauses processing and sends an alert to the user requesting National ID (NIN) submission before disbursement.

---

## 3. Product Management & Configuration

To add or update products:
1. Navigate to the **Products** tab in the Admin Console.
2. Ensure the price is at or above the minimum threshold of **UGX 10,000**.
3. Configure:
   - **Product Name** & **Category**
   - **Price (UGX)**
   - **Term Duration (Days)**
   - **Daily Operating Rate** (e.g., `0.025` for 2.5% daily yield)
   - **Purchase Limit** per user
   - **Status**: Active or Locked
4. All frontend calculations dynamically compute:
   $$\text{Projected Reward} = \text{Price} \times \text{Daily Rate} \times \text{Duration}$$
   and display explicit legal risk notices.

---

## 4. Platform Settings

Under **Settings**, administrators can calibrate:
- `min_deposit_ugx`: Default `10000`
- `min_withdrawal_ugx`: Default `5000`
- `l1_referral_percentage`: Level 1 Direct Referral commission (Default: `5.0`%)
- `l2_referral_percentage`: Level 2 Indirect Referral commission (Default: `2.0`%)
- `referral_eligibility_min_deposit`: Minimum deposit to unlock referral rewards (Default: `10000`)
- `momo_gateway_mode`: `sandbox` or `live`
