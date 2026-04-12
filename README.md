# Canton Dark Pool

**Privacy-native institutional dark pool for block trade matching on Canton.**

This project implements a canonical dark pool where institutional counterparties can submit sealed limit orders for block trades. Canton's privacy model ensures that order details remain confidential, with zero pre-trade transparency. Matched trades settle atomically, creating a complete and auditable trail only for the involved parties.

This model leverages Canton's unique architecture to solve the core challenges of dark pools: information leakage and counterparty risk.

---

## Overview

A dark pool is a private forum for trading securities, derivatives, and other financial instruments. They are called "dark" because they do not publish pre-trade data like bid/ask quotes. This project provides a robust, decentralized implementation of such a venue on the Canton Network.

### Key Features

*   **Sealed-Bid Orders**: Participants submit `LimitOrder` contracts where the price and quantity are private to them. Neither the operator nor other participants can see the order book.
*   **Privacy by Design**: Canton's underlying privacy protocol guarantees that contract data is only shared with stakeholders. An order is only visible to the submitting party until a match is found and proposed.
*   **Atomic Settlement**: When a match is accepted by both counterparties, the resulting `MatchedTrade` is created in the same atomic transaction. There is no settlement risk.
*   **Verifiable Audit Trail**: While pre-trade data is private, settled trades create an immutable record shared exclusively between the two counterparties and the operator, ensuring regulatory compliance and auditability.
*   **Operator-Driven Matching**: A designated pool operator runs an off-ledger matching engine. The on-ledger Daml contracts are used for order submission, trade confirmation, and settlement, not for the matching algorithm itself. This allows for complex, high-performance matching logic while keeping the sensitive settlement on-ledger.

## Privacy Guarantees: Why Canton?

Traditional dark pools rely on the legal and operational integrity of a central operator to maintain privacy. Canton enforces this privacy at the protocol level.

1.  **No Public Order Book**: Unlike transparent exchanges, there is no central, publicly visible order book. Each `LimitOrder` is a private Daml contract between the trader and the operator.
2.  **Sub-transaction Privacy**: When the operator proposes a `MatchedTrade` to two counterparties (Alice and Bob), Canton ensures that Alice does not see Bob's original `LimitOrder` contract, and vice-versa. They only see the `MatchedTrade` proposal that they are a party to.
3.  **Need-to-Know Data Distribution**: The Canton ledger only synchronizes data to the participants who are stakeholders on a given contract. The rest of the network remains unaware of the trade's existence, size, or price.

## Trading Workflow

The lifecycle of a trade in the Canton Dark Pool follows these steps:

1.  **Onboarding**: An `Operator` party onboards institutional `Trader` parties by creating a `TradingRelationship` contract for each. This contract governs their ability to participate in the pool.

2.  **Order Submission**: A `Trader` submits a buy or sell order by creating a `LimitOrder` contract. This contract is private between the `Trader` and the `Operator`. It specifies the instrument, quantity, limit price, and side (Buy/Sell).

3.  **Off-Ledger Matching**: The `Operator`'s off-ledger matching engine continuously scans the active `LimitOrder` contracts it is a stakeholder on. When it finds a potential match (e.g., a buy order and a sell order with a compatible price), it initiates the settlement process.

4.  **Trade Proposal**: The `Operator` exercises the `ProposeMatch` choice on both `LimitOrder` contracts. This creates a `MatchedTradeProposal` contract, which is offered to both counterparties. This proposal contains the final execution price and quantity.

5.  **Counterparty Consent**: Both traders must actively consent to the match by exercising the `Accept` choice on their respective `MatchedTradeProposal`. This is a critical step ensuring both parties agree to the terms of the matched trade.

6.  **Atomic Settlement**: Once the second party accepts, the `MatchedTradeProposal` is consumed and an archival `MatchedTrade` contract is atomically created. This final contract serves as the immutable record of the completed trade, visible only to the two traders and the operator. The original `LimitOrder` contracts are archived.

## Project Structure

The Daml model is organized into the following modules:

*   `daml/DarkPool/Role.daml`: Defines the `OperatorRole` and `TradingRelationship` contracts that manage permissions and relationships between the operator and traders.
*   `daml/DarkPool/Order.daml`: Contains the `LimitOrder` template for submitting sealed buy/sell orders.
*   `daml/DarkPool/Trade.daml`: Contains the `MatchedTradeProposal` and `MatchedTrade` templates that represent the workflow from a proposed match to final settlement.

## Getting Started

### Prerequisites

*   DPM (Canton SDK version 3.4.0 or later). Install from [get.digitalasset.com](https://get.digitalasset.com).

### Build the Project

Compile the Daml code into a DAR (Daml Archive).

```sh
dpm build
```

The output will be located in `.daml/dist/canton-dark-pool-0.1.0.dar`.

### Run a Local Ledger

Start a local Canton sandbox environment. The JSON API will be available on port 7575.

```sh
dpm sandbox
```

### Run Tests

Execute the Daml Script tests to verify the contract logic and workflow.

```sh
dpm test
```

## License

This project is licensed under the [Apache License 2.0](LICENSE).