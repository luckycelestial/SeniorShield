"""
tests/test_phase5_rules.py
==========================
Unit & Context-Aware Tests for Rule-Based Signal Engine (Phase 5).
"""

import os
import sys

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rules.engine import RuleEngine


def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))


def test_required_rules():
    safe_print("\n=== Test 1: Required Individual Rule Triggers ===")
    engine = RuleEngine()

    # 1. OTP_REQUEST
    res = engine.evaluate("Please share your OTP to complete login.")
    assert "OTP_REQUEST" in res.matched_rule_ids
    safe_print("  [PASS] 1. OTP_REQUEST matched on active request")

    # 2. CREDENTIAL_REQUEST
    res = engine.evaluate("Send your UPI PIN and card CVV immediately.")
    assert "CREDENTIAL_REQUEST" in res.matched_rule_ids
    safe_print("  [PASS] 2. CREDENTIAL_REQUEST matched on PIN/CVV")

    # 3. KYC_CONTEXT
    res = engine.evaluate("Your Aadhaar verification and KYC update are pending.")
    assert "KYC_CONTEXT" in res.matched_rule_ids
    safe_print("  [PASS] 3. KYC_CONTEXT matched")

    # 4. URGENCY_SIGNAL
    res = engine.evaluate("Final warning: your account will be blocked within 10 minutes.")
    assert "URGENCY_SIGNAL" in res.matched_rule_ids
    safe_print("  [PASS] 4. URGENCY_SIGNAL matched")

    # 5. PAYMENT_REQUEST
    res = engine.evaluate("Transfer Rs 500 processing fee to claim your gift.")
    assert "PAYMENT_REQUEST" in res.matched_rule_ids
    safe_print("  [PASS] 5. PAYMENT_REQUEST matched")

    # 6. AUTHORITY_REFERENCE
    res = engine.evaluate("CBI cyber crime police department issued an arrest warrant.")
    assert "AUTHORITY_REFERENCE" in res.matched_rule_ids
    safe_print("  [PASS] 6. AUTHORITY_REFERENCE matched")

    # 7. REMOTE_ACCESS_SIGNAL
    res = engine.evaluate("Install AnyDesk support application and give screen access.")
    assert "REMOTE_ACCESS_SIGNAL" in res.matched_rule_ids
    safe_print("  [PASS] 7. REMOTE_ACCESS_SIGNAL matched")

    # 8. URL_PRESENT
    res = engine.evaluate("Click https://secure-verify.com/login to update.")
    assert "URL_PRESENT" in res.matched_rule_ids
    safe_print("  [PASS] 8. URL_PRESENT matched")


def test_negation_and_false_positives():
    safe_print("\n=== Test 2: Negation & False-Positive Advisory Resistance ===")
    engine = RuleEngine()

    # Negation 1: "Never share your OTP with anyone."
    res1 = engine.evaluate("Never share your OTP with anyone.")
    assert "OTP_REQUEST" not in res1.matched_rule_ids, "Should NOT trigger OTP_REQUEST on advisory warning!"
    safe_print("  [PASS] Advisory 'Never share your OTP' did not trigger OTP_REQUEST")

    # Negation 2: "Bank will never ask for your password or PIN."
    res2 = engine.evaluate("Bank will never ask for your password or PIN.")
    assert "CREDENTIAL_REQUEST" not in res2.matched_rule_ids, "Should NOT trigger CREDENTIAL_REQUEST on warning!"
    safe_print("  [PASS] Advisory 'Bank will never ask for your password' did not trigger CREDENTIAL_REQUEST")

    # Legitimate Message: "Your KYC documents were received successfully."
    res3 = engine.evaluate("Your KYC documents were received successfully.")
    assert "KYC_CONTEXT" in res3.matched_rule_ids
    assert "OTP_REQUEST" not in res3.matched_rule_ids
    assert "URGENCY_SIGNAL" not in res3.matched_rule_ids
    safe_print("  [PASS] Informational KYC did not trigger scam rules")

    # Legitimate Message: "Your electricity bill is due tomorrow. Pay on the official app."
    res4 = engine.evaluate("Your electricity bill of Rs 540 is due tomorrow. Pay on official app.")
    assert "OTP_REQUEST" not in res4.matched_rule_ids
    assert "CREDENTIAL_REQUEST" not in res4.matched_rule_ids
    safe_print("  [PASS] Routine utility bill did not trigger OTP/Credential rules")


def test_compound_rules():
    safe_print("\n=== Test 3: Compound / Combination Rules ===")
    engine = RuleEngine()

    # Combination 1: OTP_REQUEST + PAYMENT_REQUEST
    res1 = engine.evaluate("Transfer Rs 1000 and share your OTP.")
    assert "OTP_PAYMENT_COMBINATION" in res1.matched_rule_ids
    safe_print("  [PASS] OTP_PAYMENT_COMBINATION triggered")

    # Combination 2: AUTHORITY_REFERENCE + PAYMENT_REQUEST + URGENCY_SIGNAL
    res2 = engine.evaluate("Police have issued a warrant. Pay Rs 5000 fine immediately.")
    assert "URGENCY_AUTHORITY_PAYMENT" in res2.matched_rule_ids
    safe_print("  [PASS] URGENCY_AUTHORITY_PAYMENT triggered")

    # Combination 3: KYC_CONTEXT + OTP_REQUEST + URGENCY_SIGNAL
    res3 = engine.evaluate("Your KYC will expire today. Share your OTP immediately.")
    assert "KYC_OTP_URGENCY_COMBINATION" in res3.matched_rule_ids
    assert "KYC_CONTEXT" in res3.matched_rule_ids
    assert "OTP_REQUEST" in res3.matched_rule_ids
    assert "URGENCY_SIGNAL" in res3.matched_rule_ids
    safe_print("  [PASS] KYC_OTP_URGENCY_COMBINATION triggered for classic phishing SMS")


if __name__ == "__main__":
    safe_print("============================================================")
    safe_print("RUNNING PHASE 5 RULE-BASED ENGINE TEST SUITE")
    safe_print("============================================================")
    test_required_rules()
    test_negation_and_false_positives()
    test_compound_rules()
    safe_print("\n============================================================")
    safe_print("ALL PHASE 5 RULE TESTS PASSED!")
    safe_print("============================================================")
