// @ts-check

import { Component, createRef, Fragment } from "react";
import PriorityQueue from "../../src/priority-queue";

function createId() {
  return `${Math.floor(Math.random() * 1e8)}-${Math.floor(Math.random() * 1e8)}-${Date.now()}`
}

const priorityQueue = new PriorityQueue({
  compare: (a, b) => {
    if (a.priority > b.priority) return -1;
    else if (a.priority < b.priority) return 1;
    return 0;
  }
});

const ghostStyle = {
  position: "absolute",
  width: 0,
  height: 0,
  visibility: "hidden",
  display: "none"
};

async function createServiceWorkerProxy() {
  const promiseMap = new Map()

  const messageChannel = new MessageChannel()
  messageChannel.port1.onmessage = event => {
    // console.log('client message received', event)
    const { result, error, id: commandId } = event.data
    // console.log('result', result)
    const[resolve, reject] = promiseMap.get(commandId)
    if (error) {
      reject(error)
    } else {
      resolve(result)  
    }
  }
  const sw = navigator.serviceWorker.controller
  if (!sw) {
    console.warn('No active SW')
    return null;
  }

  function handshake() {
    const commandId = createId()
    sw.postMessage({ command: 'handshake', id: commandId }, [messageChannel.port2])
    return new Promise((resolve, reject) => {
      promiseMap.set(commandId, [(...args) => {
        promiseMap.delete(commandId)
        resolve(...args)
      }, (...args) => {
        promiseMap.delete(commandId)
        reject(...args)
      }])  
    })
  }
  await handshake()

  const commands = {
    addToCache: url => {
      const commandId = createId()
      sw.postMessage({ command: 'add-to-cache', id: commandId, args: [url] })
      return new Promise((resolve, reject) => {
        promiseMap.set(commandId, [(...args) => {
          promiseMap.delete(commandId)
          resolve(...args)
        }, (...args) => {
          promiseMap.delete(commandId)
          reject(...args)
        }])  
      })    
    }
  }
  
  return commands
}

class PriorityQueueSubscriber {
  _state = {
    isPrefetching: false
  }
  _args = {
    priorityQueue: null,
    swProxy: null
  }

  constructor({ priorityQueue, swProxy }) {
    this._args.priorityQueue = priorityQueue
    this._args.swProxy = swProxy
    
    priorityQueue.subscribe(() => {
      this._handlePriorityQueueChange()
    })

    if (priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    }
  }

  async _getNextFromPriorityQueue() {
    const topOfQueue = this._args.priorityQueue.pop();
    this._state.isPrefetching = true
    topOfQueue.onStart();
    try {
      // console.log('topOfQueue', topOfQueue)
      await this._args.swProxy.addToCache(topOfQueue.href)
      topOfQueue.onLoad()
      this._handlePrefetchLoad()
    } catch (error) {
      // console.error('error on caching on sw', error)
      topOfQueue.onError(error)
      this._handlePrefetchError(error)
    }
  }

  async _handlePrefetchLoad() {
    console.log("load prefetch link");
    if (this._args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    } else {
      this._state.isPrefetching = false
    }
  };

  async _handlePrefetchError(error) {
    console.log("handlePrefetchError");
    if (this._args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    } else {
      this._state.isPrefetching = false
    }
  };

  async _handlePriorityQueueChange() {
    console.log("handlePriorityQueueChange");
    if (!this._state.isPrefetching && this._args.priorityQueue.size > 0) {
      await this._getNextFromPriorityQueue();
    }
  };
}

async function handleOnBrowser() {
  const registration = await navigator.serviceWorker.register('/service-worker.js')
  console.log('service worker registered', registration)
  const swProxy = await createServiceWorkerProxy()
  if (!swProxy) {
    return
  }
  const priorityQueueSubscriber = new PriorityQueueSubscriber({ priorityQueue, swProxy })
}

if (process.browser) {
  handleOnBrowser()
  window.priorityQueue = priorityQueue
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

class Prefetchable extends Component {
  state = {
    linkToPrefetch: null,
    prefetchStatus: "queued"
  };

  ref = createRef();

  child = null;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const domNode = this.ref.current;
    this.child = domNode.nextSibling;

    this.intersectionObserver = new IntersectionObserver(
      this.handleChildViewportIntersection,
      { threshold: 1 }
    );

    this.intersectionObserver.observe(this.child);
  }

  componentWillUnmount() {
    this.intersectionObserver.unobserve(this.child);
  }

  handleChildViewportIntersection = changes => {
    console.log("changes", changes);

    changes.forEach(change => {
      if (!change.isIntersecting) return;

      const link = getLink(this.child);
      if (!link) return;

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

      this.intersectionObserver.unobserve(this.child);
    });
  };

  handlePrefetchStart = () => {
    console.log("start");
    this.setState({ prefetchStatus: "started" });
  };

  handlePrefetchLoad = () => {
    console.log("load");
    this.setState({ prefetchStatus: "loaded" });
  };

  handlePrefetchError = () => {
    console.log('error')
    this.setState({ prefetchStatus: "error" });
  };

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
