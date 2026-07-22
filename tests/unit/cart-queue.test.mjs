import assert from "node:assert/strict";
import { enqueueCartOp, __resetCartQueueForTests } from "../../src/stores/cartStore.ts";

export default {
  async "enqueueCartOp serialises overlapping operations"() {
    __resetCartQueueForTests();
    const order = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const p1 = enqueueCartOp(async () => {
      await wait(20);
      order.push("a");
    });
    const p2 = enqueueCartOp(async () => {
      order.push("b");
    });
    await Promise.all([p1, p2]);
    assert.deepEqual(order, ["a", "b"], "second op must wait for first");
  },
  async "enqueueCartOp keeps chain alive after a rejection"() {
    __resetCartQueueForTests();
    const p1 = enqueueCartOp(async () => {
      throw new Error("boom");
    });
    await p1.catch(() => undefined);
    let ran = false;
    await enqueueCartOp(async () => {
      ran = true;
    });
    assert.equal(ran, true);
  },
};
