# Canton Dark Pool: Participant Guide

## 1. Overview

Welcome to the Canton Dark Pool, a next-generation block trading venue designed for institutional participants. Built on the Canton network, our platform offers unparalleled pre-trade privacy, guaranteed atomic settlement, and a verifiable audit trail, eliminating counterparty and settlement risk.

This guide provides the necessary information for participants to onboard, submit orders, and understand the trade lifecycle.

**Key Benefits:**

*   **Zero Pre-Trade Transparency:** Your orders are completely confidential. Due to Canton's privacy model, no other participant, not even the operator, can see the specifics of your un-matched orders. Information is only revealed to the matched counterparty at the time of trade confirmation.
*   **Atomic Delivery-vs-Payment (DvP) Settlement:** Trades settle on a T+0 basis in a single, indivisible transaction. The security and payment assets are exchanged simultaneously, eliminating settlement risk.
*   **Reduced Market Impact:** Execute large block trades without signaling your intent to the broader market, preventing adverse price movements.
*   **Verifiable Audit Trail:** Every action, from order submission to settlement, is immutably recorded on a distributed ledger, providing a golden source of truth for all stakeholders.

---

## 2. Onboarding Process

Joining the Canton Dark Pool involves a straightforward, two-step process managed by the Pool Operator.

**Step 1: KYC/AML and Legal Agreement**

1.  **Contact the Operator:** Reach out to our onboarding team at `onboarding@canton-dark-pool.com`.
2.  **Due Diligence:** Complete our standard institutional Know Your Customer (KYC) and Anti-Money Laundering (AML) verification process.
3.  **Sign Participant Agreement:** Execute the Master Participant Agreement, which governs the terms of service.

**Step 2: Canton Identity and Access Grant**

1.  **Party Allocation:** Upon successful verification, the Pool Operator will allocate a unique cryptographic identity for you on the Canton network. This is known as a `Party` and will look similar to `YourInstitution::1220...`. This `Party` is your unique identifier for all activities within the dark pool.
2.  **Participant Role Grant:** The Operator will create a `ParticipantRole` contract on the ledger with you as the signatory. This digital contract formally grants your `Party` the rights to submit orders and participate in the matching pool. You must have an active `ParticipantRole` contract to use the venue.

Once these steps are complete, your organization is fully onboarded and can begin submitting orders via our API.

---

## 3. Order Types and Submission

The primary function of the pool is to match sealed limit orders for supported securities.

### Supported Order Types

Currently, the pool supports **Limit Orders** for both buy and sell sides.

A Limit Order consists of the following parameters:
*   **`instrument` (Text):** The identifier for the security (e.g., ISIN, CUSIP, or internal symbol like "ACME_STOCK").
*   **`quantity` (Decimal):** The number of units to buy or sell.
*   **`price` (Decimal):** The limit price.
    *   For a **Buy Order**, this is the *maximum* price you are willing to pay.
    *   For a **Sell Order**, this is the *minimum* price you are willing to accept.
*   **`side` (Buy/Sell):** The direction of your order.
*   **`settlementCcy` (Text):** The currency symbol for settlement (e.g., "USD", "EUR"). This must correspond to a Canton-native tokenized cash instrument.

### Order Submission

Orders are submitted as `OrderRequest` contracts via the API. When submitted, an `Order` contract is created on the ledger.

**Crucially, this `Order` contract is only visible to you (the participant) and the Pool Operator.** This is the core of our privacy guarantee. The Daml contract's privacy rules enforce this confidentiality at the protocol level.

---

## 4. Matching and Trade Confirmation

### Matching Engine Logic

The Pool Operator runs a matching engine that continuously and confidentially scans the order book for potential matches. The matching logic follows standard **Price-Time Priority**:

1.  **Price Priority:** Buy orders with higher prices and sell orders with lower prices are prioritized.
2.  **Time Priority:** For orders at the same price, the one submitted earliest gets priority.

### The Trade Lifecycle

1.  **Match Found:** When the engine finds a crossing buy and sell order, it initiates the trade confirmation process.
2.  **`MatchedTrade` Proposal:** The Operator creates a `MatchedTrade` proposal contract. This contract contains the final trade details: the instrument, quantity, and the execution price (typically the midpoint or the price of the passive order).
3.  **Disclosure:** The `MatchedTrade` proposal is atomically disclosed to *both* the buyer and the seller. **This is the first moment that the two counterparties become aware of each other and the impending trade.**
4.  **Participant Consent:** Both the buyer and the seller must actively exercise the `Accept` choice on the `MatchedTrade` proposal. This signifies their final consent to the trade. If either party fails to accept within the specified time window (see SLA), the proposal expires and the original orders may be returned to the book.

---

## 5. Settlement

### Atomic Delivery-vs-Payment (DvP)

Settlement is triggered when both parties have exercised `Accept` on the `MatchedTrade` contract. The Canton platform guarantees that the subsequent exchange of assets is **atomic**.

*   The seller's securities are transferred to the buyer.
*   The buyer's payment (tokenized cash) is transferred to the seller.

These two transfers occur within a single, indivisible transaction. It is impossible for one leg of the transfer to happen without the other. **This completely eliminates settlement risk.**

### Settlement SLA

*   **Confirmation Window:** Participants have **60 seconds** to `Accept` a `MatchedTrade` proposal after it is created.
*   **Settlement Time:** Settlement is **instantaneous (T+0)** upon acceptance by both parties. The entire DvP process finalizes within seconds.
*   **Required Assets:** Participants must ensure they hold the requisite assets (securities for the seller, cash for the buyer) in their Canton wallet *before* accepting a trade. The atomic settlement will fail if the underlying assets are not available, and the trade will be voided.

---

## 6. Technical Integration

Interaction with the dark pool is performed via a secure, authenticated JSON API. We provide a TypeScript SDK (`@canton-dark-pool/client`) to simplify integration.

### Example: Submitting an Order

```typescript
import { DarkPoolClient } from '@canton-dark-pool/client';

const client = new DarkPoolClient({
  host: 'api.canton-dark-pool.com',
  party: 'YourInstitution::1220...',
  token: 'YOUR_JWT_TOKEN'
});

const order = {
  instrument: 'ACME_STOCK',
  quantity: '10000.0',
  price: '150.25',
  side: 'Buy',
  settlementCcy: 'USD'
};

const { contractId } = await client.submitOrder(order);
console.log(`Order submitted with ID: ${contractId}`);
```

### Example: Handling Matched Trades

Your application should listen for `MatchedTrade` proposals and have logic to automatically or manually accept them.

```typescript
// Listen for incoming MatchedTrade contracts
client.onMatchedTrade((trade) => {
  console.log('New trade proposal received:', trade);
  // Implement your internal logic to approve the trade
  const approved = checkInternalLimits(trade.payload);

  if (approved) {
    client.acceptTrade(trade.contractId)
      .then(() => console.log('Trade accepted and settled!'))
      .catch((err) => console.error('Failed to accept trade:', err));
  }
});
```

Please refer to the full API documentation and SDK guide for detailed integration instructions.

---

## 7. Support

For questions regarding onboarding, technical integration, or trading, please contact our support desk.

*   **Onboarding & General Inquiries:** `onboarding@canton-dark-pool.com`
*   **Technical Support:** `tech-support@canton-dark-pool.com`