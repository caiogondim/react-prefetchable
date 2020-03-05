import { Component, createRef, Fragment } from "react";
import PriorityQueue from "../../src/priority-queue";

const prefetchedElements = new Set();
const priorityQueue = new PriorityQueue({
  compare: (a, b) => {
    if (a.priority > b.priority) return -1;
    else if (a.priority < b.priority) return 1;
    return 0;
  }
});

priorityQueue.subscribe(() =>
  console.log("pq change", JSON.stringify(priorityQueue._data))
);

const ghostStyle = {
  position: "absolute",
  width: 0,
  height: 0,
  visibility: "hidden",
  display: "none"
};

class PrefetchBlock extends Component {
  state = {
    links: [],
    isPrefetching: false
  };
  // Sometimes we `setState` on links more than once at the same event loop.
  // React batches `setState` and does shallow copy only, which creates an
  // inconsistent state for the component.
  links = [];

  constructor() {
    super();
    priorityQueue.subscribe(() => {
      this.handlePriorityQueueChange();
    });
  }

  _getNextFromPriorityQueue() {
    const topOfQueue = priorityQueue.pop();
    this.links = [...this.links, topOfQueue];
    this.setState({ links: [...this.links], isPrefetching: true });
    topOfQueue.onStart();
  }

  componentDidMount() {
    if (priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    }
  }

  handlePrefetchLoad = () => {
    console.log("load prefetch link");
    if (priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    } else {
      this.setState({ isPrefetching: false });
    }
  };

  handlePrefetchError = error => {
    if (priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    } else {
      this.setState({ isPrefetching: false });
    }
  };

  handlePriorityQueueChange = () => {
    console.log("handlePriorityQueueChange");
    if (!this.state.isPrefetching && priorityQueue.size > 0) {
      this._getNextFromPriorityQueue();
    }
  };

  render() {
    if (!process.browser) {
      return null;
    }
    console.log("rende", this.state);

    return this.state.links.map(link => (
      <link
        key={link.key}
        rel="prefetch"
        href={link.href}
        onLoad={() => {
          this.handlePrefetchLoad();
          link.onLoad();
        }}
        onError={() => {
          this.handlePrefetchError();
          link.onError();
        }}
      />
    ));
  }
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
        priority: Math.random(),
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

export { Prefetchable, PrefetchBlock };
