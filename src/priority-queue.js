// @ts-check

/**
 * @param {number} a
 * @param {number} b
 * @returns {-1 | 0 | 1}
 */
function defaultCompare(a, b) {
  if (a > b) return -1;
  else if (a < b) return 1;
  else return 0;
}

class PriorityQueue {
  /**
   * @param {Object} options
   * @param {(a: any, b: any) => -1 | 0 | 1} options.compare
   */
  constructor({ compare = defaultCompare } = { compare: defaultCompare }) {
    /**
     * @type {(a: any, b: any) => -1 | 0 | 1}
     * @private
     */
    this._compare = compare;

    /**
     * @type {any[]}
     * @private
     */
    this._data = [];

    /**
     * @type {Function[]}
     * @private
     */
    this._subscribers = [];
  }

  /**
   * @returns {number}
   */
  get size() {
    return this._data.length;
  }

  /**
   * @param {any} val
   * @returns {void}
   */
  push(val) {
    if (this._data.length === 0) {
      this._data.push(val);
      this._subscribers.forEach(subscriber => subscriber(this));
      return;
    }

    for (let i = 0; i < this._data.length; i += 1) {
      if (this._compare(val, this._data[i]) < 0) {
        this._data.splice(i, 0, val);
        this._subscribers.forEach(subscriber => subscriber(this));
        return;
      }
    }

    this._data.push(val);
    this._subscribers.forEach(subscriber => subscriber(this));
  }

  pop() {
    if (this._data.length === 0) {
      return;
    }

    const top = this._data.shift();

    this._subscribers.forEach(subscriber => subscriber(this));

    return top;
  }

  /**
   * @param {any} val
   * @returns {Boolean}
   */
  has(val) {
    for (let i = 0; i < this._data.length; i += 1) {
      if (this._compare(this._data[i], val) === 0) return true;
    }

    return false;
  }

  peek() {
    return this._data[0];
  }

  /**
   * @param {any} val
   * @returns {Boolean}
   */
  delete(val) {
    for (let i = 0; i < this._data.length; i += 1) {
      if (this._compare(this._data[i], val) === 0) {
        this._data.splice(i, 1);
        this._subscribers.forEach(subscriber => subscriber(this));
        return true;
      }
    }

    return false;
  }

  /**
   * @param {Function} next
   * @returns {Function} unsubscriber
   */
  subscribe(next) {
    this._subscribers.push(next);
    return () => {
      this._subscribers = this._subscribers.filter(
        subscriber => subscriber !== next
      );
    };
  }
}

module.exports = PriorityQueue;
