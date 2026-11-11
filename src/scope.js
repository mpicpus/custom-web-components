const Scope = (_scope = {}, element, subscribers = {}) => {
  const scopeHandler = {
    set: (obj, prop, newVal) => {
      const scopeUpdates = {};
      
      scopeUpdates[prop] = newVal;
      obj[prop] = newVal;

      if (element?.update) element.update(scopeUpdates);
      return true;
    }
  , ...subscribers};

  const proxy = new Proxy(_scope, scopeHandler);
  return proxy;
}

export default Scope;
