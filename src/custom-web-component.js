import Scope from "./scope.js";

class CustomComponent extends HTMLElement {
  // Templates can use the extrapolation pattern defined in this Regex, like so: {{variable}}
  static extrapolationRegexp = RegExp(/{{(\w+)}}/g);

  constructor(_templateName = "", _scope = {}, subscribers = {}) {
    super();

    this.templateName = _templateName;
    this.scope = Scope(_scope, this, subscribers);
    this.attrs = Scope({}, this);
    this.rendered = false;
    
    this.initialize(_scope);
    this.renderBaseTemplate(_scope);    
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.attrs[name] = newValue;
  }

  update(_scope = {}) {
    const scopeSet = new Set(Object.keys(_scope));

    const updateIndexes =
      this.dynamicVariables
      .flatMap((variables, i) =>
        variables.some((variable) => scopeSet.has(variable)) ? i : null
      ).filter(itemExists => itemExists !== null);
    
    updateIndexes.forEach(index => {
      const element = this.dynamicElements[index];
      const originalTemplate = this.originalContents[index];
      const newContent = 
        originalTemplate
        .replaceAll(CustomComponent.extrapolationRegexp, (match, capt) => _scope[capt] || capt);

      element.textContent = newContent;
    });
  }

  // These three attributes are parallel, that is, each element finds their count
  initialize(_scope = {}) {
    this.template = this.getBaseTemplate();
    this.dynamicElements = this.interpolableElements(this.template);
    this.originalContents = this.dynamicElements.map(el => el.textContent);
    this.dynamicVariables = this.dynamicElements.map(el => this.extractVarNames(el));
  }

  renderBaseTemplate(_scope = {}) {
    this.update(_scope);

    this.appendChild(this.template);
    this.rendered = true;
  }

  getBaseTemplate(_templateName = this.templateName) {
    const template = document
          .querySelector(`template#${_templateName}`)
          ?.content;

    return document.importNode(template, true);
  }

  interpolableElements(template = this) {
    return this
            .recursiveExtractChildren(template)
            .filter(el => CustomComponent.extrapolationRegexp.test(el.textContent));
  }

  recursiveExtractChildren = (component = this, children = []) => {
    const newChildren = component.children;
    const leaves = Array.from(newChildren).filter(el => !el.children.length);
    const branches = Array.from(newChildren).filter(el => el.children.length);

    const furtherLeaves = branches.map(el => this.recursiveExtractChildren(el, children))?.flat();
    children = children.concat(leaves, branches, furtherLeaves);

    return children;
  }

  extractVarNames(element) {
    return element.textContent?.match(/{{(\w+)}}/g)?.map(entry => entry.replace(/[{}]/g, ""));
  }
}

export default CustomComponent;
