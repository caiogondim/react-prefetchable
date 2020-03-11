import Head from "next/head";
import Link from "next/link";
import { Prefetchable } from "../components/prefetchable";

const containerStyle = {
  width: "100%",
  maxWidth: "800px",
  display: "flex",
  flexDirection: "column"
};

const rowStyle = {
  width: "100%",
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px"
};

const linkBaseStyle = {
  display: "block",
  height: "100%",
  transition: "all 0.25s ease-in"
};

function getBackgroundColor(prefetchStatus) {
  if (prefetchStatus === "queued") return "rgba(0, 0, 0, 0.2)";
  if (prefetchStatus === "started") return "rgba(0, 255, 0, 0.2)";
  if (prefetchStatus === "loaded") return "rgba(0, 0, 255, 0.2)";
  if (prefetchStatus === "error") return "rgba(255, 0, 0, 0.2)";
}

const Home = () => (
  <div style={containerStyle}>
    <div style={{ ...rowStyle, height: "600px" }}>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/error"
            style={{
              ...linkBaseStyle,
              width: "calc(30% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            Error
          </a>
        )}
      </Prefetchable>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(70% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            One
          </a>
        )}
      </Prefetchable>
    </div>
    <div style={{ ...rowStyle, height: "600px" }}>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            One
          </a>
        )}
      </Prefetchable>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            One
          </a>
        )}
      </Prefetchable>
      <Prefetchable>
        {prefetchStatus => (
          <a
            href="/one"
            style={{
              ...linkBaseStyle,
              width: "calc(33% - 5px)",
              backgroundColor: getBackgroundColor(prefetchStatus)
            }}
          >
            One
          </a>
        )}
      </Prefetchable>
    </div>
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
            One
          </a>
        )}
      </Prefetchable>
    </div>
  </div>
);

export default Home;
