const PriorityQueue = require("./priority-queue");

describe("PriotityQueue.prototype.push", () => {
  it("", () => {
    const pq = new PriorityQueue();

    pq.push(1);
    expect(pq.peek()).toEqual(1);

    pq.push(2);
    expect(pq.peek()).toEqual(2);

    pq.push(4);
    expect(pq.peek()).toEqual(4);

    pq.push(3);
    expect(pq.peek()).toEqual(4);
  });
});

describe("PriotityQueue.prototype.pop", () => {
  it("", () => {
    const pq = new PriorityQueue();
    pq.push(4);
    pq.push(2);
    pq.push(1);
    pq.push(3);

    expect(pq.pop()).toEqual(4);
    expect(pq.pop()).toEqual(3);
    expect(pq.pop()).toEqual(2);
    expect(pq.pop()).toEqual(1);
  });
});

describe("PriorityQueue.prototype.delete", () => {
  it("", () => {
    const pq = new PriorityQueue();
    pq.push(4);
    pq.push(2);
    pq.push(1);
    pq.push(3);

    expect(pq.has(2)).toEqual(true);
    expect(pq.delete(2)).toEqual(true);
    expect(pq.has(2)).toEqual(false);
  });
});

describe("PriorityQueue.prototype.has", () => {
  it("", () => {
    const pq = new PriorityQueue();
    pq.push(4);
    pq.push(2);
    pq.push(1);
    pq.push(3);

    expect(pq.has(1)).toEqual(true);
    expect(pq.has(2)).toEqual(true);
    expect(pq.has(3)).toEqual(true);
    expect(pq.has(4)).toEqual(true);
    expect(pq.has(5)).toEqual(false);
  });
});
