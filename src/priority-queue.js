// todo
// implement { priority, val }

function defaultCompare(a, b) {
  if (a < b) return -1
  else if (a > b) return 1
  else return 0
}

class PriorityQueue {
  constructor({ compare = defaultCompare, onDequeue = () => {} } = {}) {
    this._data = []
    this._size = 0
    this._compare = compare
    this._onDequeue = onDequeue
  }

  get size() {
    return this._size
  }

  enqueue(val) {
    this._data.push(val)
    this._size += 1
    if (this._size > 1) {
      this._up(this._size - 1)
    }
  }

  dequeue() {
    if (this._size === 0) return undefined

    const top = this._data[0]
    const bottom = this._data.pop()
    this._size -= 1
    
    if (this._size > 0) {
      this._data[0] = bottom
      this._down()
    }
    return top
  }

  has(val) {

  }

  peek() {
    return this._data[0]
  }

  delete() {

  }

  _up(curPos) {
    const data = this._data
    const compare = this._compare
    const item = data[curPos]

    while (curPos > 0) {
      const parentPos = (curPos - 1) >> 1
      const parentVal = data[parentPos]

      if(compare(item, parentVal) < 0) break

      let curVal = data[curPos]
      data[curPos] = parentVal
      data[parentPos] = curVal

      curPos = parentPos
    }
  }

  _down(curPos = 0) {
    const data = this._data
    const compare = this._compare
    const lastPos = this._size - 1
    
    while (true) {
      let leftPos = (curPos << 1) + 1
      let rightPos = leftPos + 1
      let maxPos = curPos

      if (leftPos <= lastPos && compare(data[maxPos], data[leftPos]) < 0) {
        maxPos = leftPos
      }
      if (rightPos <= lastPos && compare(data[maxPos], data[rightPos]) < 0) {
        maxPos = rightPos
      }

      if (maxPos !== curPos) {
        let posVal = data[curPos]
        data[curPos] = data[maxPos]
        data[maxPos] = posVal
        curPos = maxPos
      } else {
        break
      }
    }
  }
}

module.exports = PriorityQueue