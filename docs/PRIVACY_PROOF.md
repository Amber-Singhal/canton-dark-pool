# Formal Proof of Zero Pre-Trade Transparency in the Canton Dark Pool

## 1. Abstract

This document provides a formal proof that the Canton Dark Pool protocol, built on the Canton network and Daml smart contracts, guarantees **zero pre-trade transparency** by design. This guarantee is not based on operational controls or trusted intermediaries in the traditional sense, but is cryptographically enforced by the underlying privacy model of the Canton protocol. We will demonstrate that no participant can gain knowledge of another participant's order, intent, or the state of the order book before a bilateral match is confirmed and mutually accepted.

## 2. Core Principles of Canton's Privacy Model

The proof rests on a fundamental feature of the Canton network: **privacy by design**. Unlike broadcast-based blockchains where every transaction is sent to every node, Canton employs a need-to-know data distribution model.

*   **Sub-transaction Privacy:** A Daml transaction is composed into a transaction tree. Canton ensures that each participant node only receives the parts of this tree (and the resulting contracts) for which they are a stakeholder.
*   **Stakeholders:** A party is a stakeholder on a contract if they are a `signatory` or an `observer`. Only stakeholders have the cryptographic right to view a contract's data.
*   **Encrypted Data Dissemination:** All contract data is encrypted and distributed point-to-point only to the participant nodes hosting the stakeholders. The synchronizer and validator nodes that order transactions do not have access to the unencrypted payload of the contracts they process.

This architecture ensures that information is compartmentalized by default. A party cannot "scan the ledger" for data they are not explicitly entitled to see.

## 3. The Lifecycle of a Dark Pool Order

We will analyze the flow of information at each stage of the order lifecycle to prove that no pre-trade information leakage occurs.

### Step 1: Order Submission

A participant, `TraderA`, submits a sealed limit order to the dark pool. This action creates an `Order` contract on the ledger. The Daml template for this contract is structured as follows:

```daml
-- From: daml/DarkPool/Order.daml (conceptual)
template Order
  with
    orderId      : Text
    submitter    : Party
    operator     : Party
    asset        : Text
    side         : Side -- Buy or Sell
    quantity     : Decimal
    limitPrice   : Decimal
  where
    signatory submitter, operator
```

*   **Stakeholders:** The only stakeholders on this `Order` contract are the `submitter` (`TraderA`) and the `operator` of the dark pool.
*   **Privacy Implication:** According to Canton's core privacy principles, only the participant nodes hosting `TraderA` and the `operator` will receive the data for this contract. No other trader (`TraderB`, `TraderC`, etc.) on the network can see this contract, know of its existence, or query its details. The order is cryptographically invisible to the rest of the market.

### Step 2: Off-Ledger Matching

The `operator` runs an off-ledger matching engine. This engine acts with the `operator`'s credentials and continuously queries the ledger for active `Order` contracts where the `operator` is a stakeholder. Since the operator is a stakeholder on *all* `Order` contracts, it has a complete view of the private order book.

When the engine finds a match between `TraderA`'s order and a corresponding order from `TraderB`, it initiates the next step.

*   **Privacy Implication:** The matching logic is contained within the operator's infrastructure. The state of the aggregate order book is known only to the operator's matching engine, not to any of the trading participants.

### Step 3: Match Proposal

Upon finding a match, the matching engine, acting as the `operator`, exercises a choice to create a `MatchProposal` contract.

```daml
-- From: daml/DarkPool/Match.daml (conceptual)
template MatchProposal
  with
    operator   : Party
    buyer      : Party
    seller     : Party
    asset      : Text
    quantity   : Decimal
    price      : Decimal -- The execution price
    buyerOrderId: ContractId Order
    sellerOrderId: ContractId Order
  where
    signatory operator
    observer buyer, seller
```

*   **Stakeholders:** The stakeholders on this `MatchProposal` are the `operator`, the `buyer` (`TraderA`), and the `seller` (`TraderB`).
*   **Privacy Implication:** This is the **first point in time** where `TraderA` and `TraderB` are made aware of each other and the specific terms of a potential trade. The proposal is a private, bilateral offer for execution. No other market participant can see this proposal.

### Step 4: Bilateral Consent and Atomic Settlement

The `MatchProposal` contract requires explicit consent from both the buyer and the seller via an `Accept` choice.

1.  `TraderA` (buyer) exercises the `Accept` choice.
2.  `TraderB` (seller) exercises the `Accept` choice.

When the second party accepts, the choice atomically executes the settlement logic defined in `DarkPool.AtomicSettlement`, which performs the Delivery-vs-Payment (DvP) exchange of assets, archives the `MatchProposal`, and archives the original `Order` contracts. This entire sequence—final consent, settlement, and cleanup—occurs within a single, atomic transaction.

*   **Privacy Implication:** The final settlement details are recorded on contracts visible only to the `buyer`, `seller`, `operator`, and any designated regulators (if included as observers). The trade is confirmed and settled without ever revealing pre-trade intent to the broader market.

## 4. Formal Proof

We can now construct a formal proof based on these steps.

*   **Premise 1:** The Canton protocol guarantees that a contract's data is only distributed to the participant nodes of its designated stakeholders (`signatory` and `observer`).
*   **Premise 2:** An `Order` contract has exactly two stakeholders: the `submitter` and the `operator`.
*   **Conclusion 1:** Therefore, an `Order` contract submitted by `TraderA` is cryptographically inaccessible to any other trading participant (`TraderB`, `TraderC`, etc.). The state of the order book is private and known only in aggregate by the `operator`.

*   **Premise 3:** A `MatchProposal` contract is created by the `operator` only *after* a valid, executable match has been identified by its private, off-ledger engine.
*   **Premise 4:** The stakeholders of a `MatchProposal` are exclusively the `operator`, the `buyer`, and the `seller` involved in that specific match.
*   **Conclusion 2:** Therefore, information about a potential trade is only revealed to the direct counterparties at the moment a concrete, actionable proposal is made. No information regarding quotes, market depth, or resting orders is ever exposed to non-involved parties.

**This sequence proves that zero pre-trade transparency is a structural guarantee of the system.**

## 5. Comparison to Traditional Systems

*   **Central Limit Order Books (CLOBs):** Are transparent by design, exposing market depth to all participants.
*   **Traditional Dark Pools:** Rely on a centralized operator's operational security and legal agreements to prevent information leakage. Data is typically co-mingled in a single, centralized database, creating a single point of failure and a target for data breaches. The Canton Dark Pool replaces this trusted operational model with a trustless, cryptographically-enforced privacy model.

## 6. Conclusion

The Canton Dark Pool's use of Daml's contract-level stakeholder model and Canton's privacy-preserving infrastructure provides a formally verifiable guarantee of zero pre-trade transparency. Participants can submit orders with the mathematical certainty that their trading intentions will remain confidential until a bilateral match is found and they explicitly consent to its execution. This elevates the standard for institutional trading privacy from a policy-based promise to a protocol-enforced reality.