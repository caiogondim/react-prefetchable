const PriorityQueue = require('./priority-queue')

describe('PriotityQueue.prototype.enqueue', () => {
  it ('', () => {
    const pq = new PriorityQueue()

    pq.enqueue(1)
    expect(pq.peek()).toEqual(1)

    pq.enqueue(2)
    expect(pq.peek()).toEqual(2)

    pq.enqueue(4)
    expect(pq.peek()).toEqual(4)

    pq.enqueue(3)
    expect(pq.peek()).toEqual(4)
   })
})

describe('PriotityQueue.prototype.dequeue', () => {
  it('', () => {
    const pq = new PriorityQueue()
    pq.enqueue(4)
    pq.enqueue(2)
    pq.enqueue(1)
    pq.enqueue(3)

    expect(pq.dequeue()).toEqual(4)
    expect(pq.dequeue()).toEqual(3)
    expect(pq.dequeue()).toEqual(2)
    expect(pq.dequeue()).toEqual(1)
  })
})