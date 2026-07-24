import assert from "node:assert/strict";
import { buildSubscriptionPayload, subscribeToNewsletter } from "../../src/lib/klaviyo.ts";

export default {
  async "rejects invalid emails"() {
    const r = await subscribeToNewsletter("not-an-email", "footer", null);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "invalid-email");
  },
  async "reports not-configured when config missing"() {
    const r = await subscribeToNewsletter("user@example.com", "footer", null);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "not-configured");
  },
  "buildSubscriptionPayload wires company, list, and email"() {
    const payload = buildSubscriptionPayload("USER@Example.com", {
      companyId: "ABC123",
      listId: "XYZ",
    });
    assert.match(payload.endpoint, /company_id=ABC123/);
    assert.equal(payload.body.data.type, "subscription");
    assert.equal(payload.body.data.relationships.list.data.id, "XYZ");
    assert.equal(payload.body.data.attributes.profile.data.attributes.email, "user@example.com");
  },
};
