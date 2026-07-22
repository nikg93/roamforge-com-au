import assert from "node:assert/strict";
import { parseConsent, DEFAULT_CONSENT, CONSENT_VERSION } from "../../src/lib/consent.ts";

export default {
  "parseConsent returns defaults for null/empty input"() {
    assert.deepEqual(parseConsent(null), DEFAULT_CONSENT);
    assert.deepEqual(parseConsent(""), DEFAULT_CONSENT);
  },
  "parseConsent resets on version mismatch"() {
    const stale = JSON.stringify({
      version: CONSENT_VERSION + 99,
      analytics: true,
      marketing: true,
      decided: true,
    });
    const result = parseConsent(stale);
    assert.equal(result.analytics, false, "stale analytics must not persist");
    assert.equal(result.marketing, false, "stale marketing must not persist");
    assert.equal(result.decided, false);
  },
  "parseConsent handles malformed JSON without throwing"() {
    const result = parseConsent("{not json");
    assert.deepEqual(result, DEFAULT_CONSENT);
  },
  "parseConsent preserves explicit true values on current version"() {
    const raw = JSON.stringify({
      version: CONSENT_VERSION,
      timestamp: 123,
      analytics: true,
      marketing: false,
      decided: true,
    });
    const result = parseConsent(raw);
    assert.equal(result.analytics, true);
    assert.equal(result.marketing, false);
    assert.equal(result.decided, true);
    assert.equal(result.necessary, true);
  },
};
