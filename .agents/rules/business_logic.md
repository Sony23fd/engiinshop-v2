# Business Logic & Financial Integrity Rules

## 1. Strict Dual-Account Boundary
- Main Shop Account (`settings.bank_*`): For product price. Хаан Банк (Ундрал Мөнхдалай).
- Cargo & Delivery Account (`settings.cargo_bank_*`, `settings.delivery_fee`): For shipping from Korea and city delivery fee. Төрийн Банк (Мөнхбат Буяннэмэх).
- Never mix or swap these accounts or their settings keys!

## 2. Delivery Authorization Gate
- Customers can ONLY receive delivery if they pay both the Cargo Fee + Delivery Fee (`delivery_fee`) to the Cargo Bank Account.
- Delivery cannot be auto-confirmed or handed over to couriers without fee verification.
- The transaction memo must be the customer's phone number (`<phone> хүргэлт`), NOT instructional text.

## 3. No Hardcoding
- Never hardcode delivery fees (e.g. `6000`). Always read dynamically from `ShopSettings.delivery_fee`.

## 4. No Logic Fabrication
- Do not invent, rewrite, or alter business rules without explicit approval.
