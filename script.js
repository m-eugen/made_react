const api = {
  get(url) {
    switch (url) {
      case "/lots":
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                id: 1,
                name: "Apple",
                description: "Apple description",
                price: 16,
              },
              {
                id: 2,
                name: "Orange",
                description: "Orange description",
                price: 41,
              },
              {
                id: 3,
                name: "Banana",
                description: "Banana description",
                price: 32,
              }
            ]);
          }, 1000);
        });
      default:
        throw new Error("Unknown address");
    }
  },
};

const stream = {
  subscribe(channel, listener) {
    const match = /price.(\d+)/.exec(channel);
    if (match) {
      setInterval(() => {
        listener({
          id: parseInt(match[1]),
          price: Math.round(Math.random() * 10 + 30),
        });
      }, 400);
    }
  },
};

let state = {
  time: new Date(),
  lots: null,
};

function App({ state }) {
  return {
    type: "div",
    props: {
      className: "app",
      children: [
        {
          type: Header,
        },
        {
          type: Clock,
          props: { time: state.time },
        },
        {
          type: Lots,
          props: { lots: state.lots },
        },
      ],
    },
  };
}

function Header() {
  return {
    type: "header",
    props: {
      className: "header",
      children: [
        {
          type: Logo,
        },
      ],
    },
  };
}

function Logo() {
  return {
    type: "img",
    props: {
      className: "logo",
      src: "logo.png",
    },
  };
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return {
    type: "div",
    props: {
      className: "clock",
      children: [
        {
          type: "span",
          props: {
            className: "value",
            children: [time.toLocaleTimeString("en-US")],
          },
        },
        {
          type: "span",
          props: {
            className: isDay ? "icon day" : "icon night",
          },
        },
      ],
    },
  };
}

function Loading() {
  return {
    type: "div",
    props: {
      className: "loading",
      children: ["Loading..."],
    },
  };
}
function Lots({ lots }) {
  if (lots === null) {
    return {
      type: Loading,
      props: {},
    };
  }

  return {
    type: "div",
    props: {
      className: "lots",
      children: lots.map((lot) => ({
        type: Lot,
        props: { lot },
      })),
    },
  };
}

function Lot({ lot }) {
  return {
    type: "article",
    key: lot.id,
    props: {
      className: "lot",
      children: [
        {
          type: "div",
          props: {
            className: "price",
            children: [lot.price],
          },
        },
        {
          type: "h1",
          props: {
            children: [lot.name],
          },
        },
        {
          type: "p",
          props: {
            children: [lot.description],
          },
        },
      ],
    },
  };
}
/* Create Timer */
setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };
  renderView(state);
}, 1000);

api.get("/lots").then((lots) => {
  state = {
    ...state,
    lots,
  };

  const onPrice = ({ id: dataId, price: dataPrice }) => {
    state = {
      ...state,
      lots: state.lots.map((lot) => {
        if (lot.id === dataId) {
          return {
            ...lot,
            price: dataPrice,
          };
        }
        return lot;
      }),
    };
    renderView(state);
  };

  lots.forEach((lot) => {
    stream.subscribe(`price-${lot.id}`, onPrice);
  });
});
/* Render function */
function renderView(state) {
  render(App({ state }), document.getElementById("root"));
}

renderView(state);
function render(virtualDom, realDomRoot) {
  const evaluateVirtualDom = evaluate(virtualDom);
  debugger;
  const virtualDomRoot = {
    type: realDomRoot.tagName.toLowerCase(),
    props: {
      id: realDomRoot.id,
      ...realDomRoot.attributes,
      children: evaluateVirtualDom,
    },
  };

  sync(virtualDomRoot, realDomRoot);
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== "object") {
    return virtualNode;
  }

  if (typeof virtualNode === "function") {
    // prettier-ignore
    return evaluate((virtualNode.type)(virtualNode.props));
  }

  const props = virtualNode.props || {};

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children)
        ? props.children.map(evaluate)
        : [evaluate(props.children)],
    },
  };
}
function sync(virtualNode, realNode) {
  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === value && name === "key") return;

      if (realNode[name] !== value) {
        realNode[name] = value;
      }
    });
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key;
  }

  if (typeof virtualNode !== "object" && virtualNode !== realNode.value) {
    realNode.nodeValue = virtualNode;
  }

  //Sync child nodes
  const virtualChildren = virtualNode.props
    ? virtualNode.props.children || []
    : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];
    // Remove
    if (virtual === undefined && real !== undefined) {
      realNode.remove(real);
    }
    // Update
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || "") === (real.tagName || "").toLowerCase()
    ) {
      sync(virtual, real);
    }
    // Replace
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || "") !== (real.tagName || "").toLowerCase()
    ) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.replaceChild(newReal, real);
    }
    // Add
    if (virtual !== undefined && real === undefined) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.appendChild(newReal);
    }
  }
}
function createRealNodeByVirtual(virtual) {
  if (typeof virtual !== "object") {
    return document.createTextNode("");
  }
  return document.createElement(virtual.type);
}
