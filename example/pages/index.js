import Head from "next/head";
import Link from "next/link";
import { CSSProperties } from "react";
import { Prefetchable } from "../components/prefetchable";

/** @type {CSSProperties} */
const containerStyle = {
  width: "100%",
  maxWidth: "800px",
  display: "flex",
  flexDirection: "column",
  marginLeft: "50%",
  position: "relative",
  transform: "translateX(-50%)"
};

/** @type {CSSProperties} */
const rowStyle = {
  width: "100%",
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px"
};

/** @type {CSSProperties} */
const linkBaseStyle = {
  display: "block",
  height: "100%",
  transition: "all 0.25s ease-in",
  boxSizing: "border-box",
  padding: "1rem"
};

const buttonStyle = {
  cursor: "pointer"
};

/**
 * @param {'stale' | 'queued' | 'started' | 'loaded' | 'error'} prefetchStatus
 * @returns {string}
 */
function getBackgroundColor(prefetchStatus) {
  if (prefetchStatus === "stale") return "rgba(0, 0, 0, 0.05)";
  if (prefetchStatus === "queued") return "rgba(0, 0, 0, 0.2)";
  if (prefetchStatus === "started") return "rgba(0, 255, 0, 0.2)";
  if (prefetchStatus === "loaded") return "rgba(0, 0, 255, 0.2)";
  if (prefetchStatus === "error") return "rgba(255, 0, 0, 0.2)";
}

let resolveStartWhen = () => {};
function startWhen() {
  return new Promise(resolve => {
    resolveStartWhen = resolve;
  });
}
const startWhenpromise = startWhen();

function handleStartClick() {
  resolveStartWhen();
}

const legendColorStyle = {
  display: "inline-block",
  width: "1rem",
  height: "1rem",
  marginRight: "1ch"
};

const Home = () => (
  <div style={containerStyle}>
    <h1>
      <code>react-sw-prefetch</code>
    </h1>
    <h2>What</h2>
    <h2>Why</h2>
    <h2>How</h2>
    <p>
      Tries to prefetch assets ahead of time in order to speed rendering of next
      page. Components wrapped in <code>Prefetch</code> that have a link in it's
      subtree will be prefetch when:
    </p>
    <ul>
      <li>Component is fully inside the viewport</li>
      <li>
        After the promise on the prop <code>startWhen</code> is resolved
      </li>
    </ul>
    <p>Or:</p>
    <ul>
      <li>On mouse hover</li>
    </ul>

    <h2>
      <abbr title="Application Programming Interface">API</abbr>
    </h2>
    <h3>Props</h3>
    <h4>
      <code>asd</code>
    </h4>
    <ul>
      <li>
        Default: <code>123</code>
      </li>
    </ul>

    <h2>Example</h2>
    <p>Each background color represents a different state:</p>
    <ul>
      <li>
        <span
          style={{
            ...legendColorStyle,
            backgroundColor: getBackgroundColor("stale")
          }}
        />
        Stale
      </li>
      <li>
        <span
          style={{
            ...legendColorStyle,
            backgroundColor: getBackgroundColor("queued")
          }}
        />
        Queued
      </li>
      <li>
        <span
          style={{
            ...legendColorStyle,
            backgroundColor: getBackgroundColor("started")
          }}
        />
        Started
      </li>
      <li>
        <span
          style={{
            ...legendColorStyle,
            backgroundColor: getBackgroundColor("loaded")
          }}
        />
        Loaded
      </li>
      <li>
        <span
          style={{
            ...legendColorStyle,
            backgroundColor: getBackgroundColor("error")
          }}
        />
        Error
      </li>
    </ul>
    <p>
      Below some examples illustrating the different scenarios the component can
      be configured.
    </p>

    <p>
      Thre is a prop called <code>startWhen</code> that behaves as gate to start
      the prefetch work. Ideally prefetch should happen after all high priority
      tasks in the current page. By default <code>startWhen</code> resolves on
      the first idle callback.
    </p>
    <p>
      The below example simulates a custom <code>startWhen</code> function.
      Press the below button to resolve the promise and start the prefetching
      work:
    </p>
    <button onClick={resolveStartWhen} style={buttonStyle}>
      Click here to start prefetching
    </button>
    <br />
    <div style={{ ...rowStyle, height: "600px" }}>
      <Prefetchable startOnResolve={startWhenpromise} onHover={false}>
        {prefetchStatus => (
          <a
            href="/error"
            style={{
              ...linkBaseStyle,
              width: "calc(30% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Tries to prefetchs an invalid URL
          </a>
        )}
      </Prefetchable>
      <Prefetchable startOnResolve={startWhenpromise} onHover={false}>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(70% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Prefetchs /one
          </a>
        )}
      </Prefetchable>
    </div>
    <p>
      Below items will start prefetching only on hover, even if{" "}
      <code>startOn</code> was not resolved.
    </p>
    <div style={{ ...rowStyle, height: "600px" }}>
      <Prefetchable onViewport={false} hoverDelay={1000}>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Prefetchs /one
          </a>
        )}
      </Prefetchable>
      <Prefetchable onViewport={false}>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Prefetchs /one
          </a>
        )}
      </Prefetchable>
      <Prefetchable onViewport={false}>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Prefetchs /one
          </a>
        )}
      </Prefetchable>
    </div>
    <p>
      Below has the default behavior. It prefetches on hover or when the element
      is fully inside the viewport. To trigger a prefetch on it, scroll to the
      bottom or hover over it.
    </p>
    <div style={{ ...rowStyle, height: "600px" }}>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(100%)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Prefetchs /one
          </a>
        )}
      </Prefetchable>
    </div>
    <h2>FAQ</h2>
    <h3>When is the cache invalidated?</h3>
    <p>lorem ipsum</p>
  </div>
);

export default Home;
