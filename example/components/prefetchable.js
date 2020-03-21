// @ts-check

import {
  Component,
  createRef,
  Fragment,
  CSSProperties,
  FunctionComponent,
  ComponentFactory,
  ReactNode
} from "react";
import PriorityQueue from "../../src/priority-queue";

/**
 * @typedef {Object} QueueItem
 * @prop {number} priority
 * @prop {string} href
 * @prop {Function} onLoad
 * @prop {Function} onError
 * @prop {Function} onStart
 * @prop {string} key
 */

function createId() {
  return `${Math.floor(Math.random() * 1e8)}-${Math.floor(
    Math.random() * 1e8
  )}-${Date.now()}`;
}

const priorityQueue = new PriorityQueue({
  compare: (/** @type {QueueItem} */ a, /** @type {QueueItem} */ b) => {
    if (a.priority > b.priority) return -1;
    else if (a.priority < b.priority) return 1;
    return 0;
  }
});

/** @type {CSSProperties} */
const ghostStyle = {
  position: "absolute",
  width: 0,
  height: 0,
  visibility: "hidden",
  display: "none"
};

async function createServiceWorkerProxy() {
  const promiseMap = new Map();

  const messageChannel = new MessageChannel();
  messageChannel.port1.onmessage = event => {
    const { result, error, id: commandId } = event.data;
    const [resolve, reject] = promiseMap.get(commandId);
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  };
  const sw = navigator.serviceWorker.controller;
  if (!sw) {
    console.warn("No active SW");
    return null;
  }

  function handshake() {
    const commandId = createId();
    sw.postMessage({ command: "handshake", id: commandId }, [
      messageChannel.port2
    ]);
    return new Promise((resolve, reject) => {
      promiseMap.set(commandId, [
        (...args) => {
          promiseMap.delete(commandId);
          resolve(...args);
        },
        (...args) => {
          promiseMap.delete(commandId);
          reject(...args);
        }
      ]);
    });
  }
  await handshake();

  const commands = {
    addToCache: url => {
      const commandId = createId();
      sw.postMessage({ command: "add-to-cache", id: commandId, args: [url] });
      return new Promise((resolve, reject) => {
        promiseMap.set(commandId, [
          (...args) => {
            promiseMap.delete(commandId);
            resolve(...args);
          },
          (...args) => {
            promiseMap.delete(commandId);
            reject(...args);
          }
        ]);
      });
    }
  };

  return commands;
}

class PriorityQueueSubscriber {
  #state = {
    isPrefetching: false
  };
  #args = {
    priorityQueue: null,
    swProxy: null
  };

  constructor({ priorityQueue, swProxy }) {
    this.#args.priorityQueue = priorityQueue;
    this.#args.swProxy = swProxy;

    priorityQueue.subscribe(() => {
      this._handlePriorityQueueChange();
    });

    if (priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    }
  }

  async _getNextFromPriorityQueue() {
    const topOfQueue = this.#args.priorityQueue.pop();
    this.#state.isPrefetching = true;
    topOfQueue.onStart();
    try {
      await this.#args.swProxy.addToCache(topOfQueue.href);
      topOfQueue.onLoad();
      this._handlePrefetchLoad();
    } catch (error) {
      topOfQueue.onError(error);
      this._handlePrefetchError(error);
    }
  }

  async _handlePrefetchLoad() {
    console.log("load prefetch link");
    if (this.#args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    } else {
      this.#state.isPrefetching = false;
    }
  }

  async _handlePrefetchError(error) {
    console.log("handlePrefetchError");
    if (this.#args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    } else {
      this.#state.isPrefetching = false;
    }
  }

  async _handlePriorityQueueChange() {
    console.log("handlePriorityQueueChange");
    if (!this.#state.isPrefetching && this.#args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    }
  }
}

async function handleOnBrowser() {
  const registration = await navigator.serviceWorker.register(
    "/service-worker.js"
  );
  console.log("service worker registered", registration);
  const swProxy = await createServiceWorkerProxy();
  if (!swProxy) {
    return;
  }
  const priorityQueueSubscriber = new PriorityQueueSubscriber({
    priorityQueue,
    swProxy
  });
}

if (typeof window !== "undefined") {
  handleOnBrowser();
}

function getLink(node) {
  if (node.tagName === "A") {
    return node.href;
  }

  const childrenAnchors = Array.from(node.querySelectorAll("a"));
  if (childrenAnchors.length > 0) {
    return childrenAnchors[0].href;
  }
}

function idle() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  let requestIdleCallback
  if (typeof window.requestIdleCallback === 'function') {
    requestIdleCallback = window.requestIdleCallback
  } else {
    requestIdleCallback = (cb) => setTimeout(cb, 1000)
  }

  return new Promise((resolve) => {
    requestIdleCallback(() => resolve())
  })
}

/**
 * @typedef {Object} PrefetchableState
 * @prop {string | null} linkToPrefetch
 * @prop {'stale' | 'queued' | 'started' | 'loaded' | 'error'} prefetchStatus
 */

/**
 * @typedef {Object} PrefetchableProps
 * @prop {(prefetchStatus: PrefetchableState['prefetchStatus']) => ReactNode} children
 * @prop {Boolean} [onHover]
 * @prop {Boolean} [onViewport]
 * @prop {Function} [startWhen]
 * @prop {Number} [hoverDelay]
 * @prop {Promise<any>} [startWhen]
 * @extends {Component<PrefetchableProps>}
 */
class Prefetchable extends Component {
  /** @type {PrefetchableProps} */
  static defaultProps = {
    onHover: true,
    onViewport: true,
    startWhen: idle(),
    hoverDelay: 50
  };

  /** @type {PrefetchableState} */
  state = {
    linkToPrefetch: null,
    prefetchStatus: "stale"
  };

  ref = createRef();

  child = null;

  /** @type {ReturnType<typeof setTimeout>} */
  timeout = null

  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    const domNode = this.ref.current;
    const { props } = this;
    this.child = domNode.nextSibling;

    if (props.onHover) {
      this.child.addEventListener("mouseenter", this.handleChildMouseEnter);
      this.child.addEventListener("mouseleave", this.handleChildMouseLeave);
    }

    console.log('waiting')
    await props.startWhen  
    console.log('after')

    if (props.onViewport) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleChildViewportIntersection,
        { threshold: 1 }
      );

      this.intersectionObserver.observe(this.child);
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  handleChildMouseEnter = () => {
    console.log("mouse enter");
     this.timeout = setTimeout(this.queueFetch, this.props.hoverDelay)
  };

  handleChildMouseLeave = () => {
    clearTimeout(this.timeout)
  }

  handleChildViewportIntersection = changes => {
    console.log("changes", changes);

    changes.forEach(change => {
      if (!change.isIntersecting) return;

      const link = getLink(this.child);
      if (!link) {
        return;
      }

      console.log("push");
      priorityQueue.push({
        priority:
          change.boundingClientRect.width * change.boundingClientRect.height,
        href: link,
        onLoad: this.handlePrefetchLoad,
        onError: this.handlePrefetchError,
        onStart: this.handlePrefetchStart,
        key: Math.random()
      });

      this.setState({ prefetchStatus: 'queued' })
    });
  };

  handlePrefetchStart = () => {
    console.log("start");
    this.setState({ prefetchStatus: "started" });
  };

  handlePrefetchLoad = () => {
    console.log("load");
    this.setState({ prefetchStatus: "loaded" });
    this.removeEventListeners();
  };

  handlePrefetchError = () => {
    console.log("error");
    this.setState({ prefetchStatus: "error" });
    this.removeEventListeners();
  };

  removeEventListeners = () => {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(this.child);
    }
    this.child.removeEventListener("mouseenter", this.handleChildMouseEnter);
  };

  queueFetch = () => {
    const link = getLink(this.child);
    if (!link) {
      return;
    }

    priorityQueue.push({
      priority: Infinity,
      href: link,
      onLoad: this.handlePrefetchLoad,
      onError: this.handlePrefetchError,
      onStart: this.handlePrefetchStart,
      key: Math.random()
    });

    this.setState({ prefetchStatus: 'queued' })
  }

  render() {
    const { children } = this.props;
    const { state } = this;

    return (
      <Fragment>
        <div ref={this.ref} style={ghostStyle} />
        {children(state.prefetchStatus)}
      </Fragment>
    );
  }
}

export { Prefetchable };
