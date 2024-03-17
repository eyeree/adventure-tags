// Global variables
let currentLocation;
let heldItems = [];
let states = {};

const locationTag = 'at-location';
const itemTag = 'at-item';
const switchTag = 'at-switch';
const caseTag = 'at-case';
const elseTag = 'at-else';
const ifTag = 'at-if';

const childCaseSelector = `:scope > ${caseTag}`;
const childElseSelector = `:scope > ${elseTag}`;
const nestedItemSelector = `:scope ${itemTag}`;
const nestedSwitchSelector = `:scope ${switchTag}`;
const nestedIfSelector = `:scope ${ifTag}`;

// Helper functions
function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`No element with id "${id}" was found.`)
    }
    return element;
}

function evaluateStateExpression(expression) {

  // Helper function to evaluate a single operand
  function evaluateOperand(operand) {
    if (operand === 'true') {
      operandStack.push(true);
    } else if (operand === 'false') {
      operandStack.push(false);
    } else {
      operandStack.push(getState(operand));
    }
  }

  // Helper function to evaluate an operator
  function evaluateOperator(operator) {
    if (operator === 'not') {
      const operandValue = operandStack.pop();
      operandStack.push(!operandValue);
    } else {
      const operand2 = operandStack.pop();
      const operand1 = operandStack.pop();
      let result;
      if (operator === 'and') {
        result = operand1 && operand2;
      } else if (operator === 'or') {
        result = operand1 || operand2;
      }
      operandStack.push(result);
    }
  }

  // Tokenizer function to handle whitespace and parentheses correctly
  function tokenize(expression) {
    const tokens = [];
    let currentToken = '';
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (char === ' ') {
        if (currentToken !== '') {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else if (char === '(' || char === ')') {
        if (currentToken !== '') {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(char);
      } else {
        currentToken += char;
      }
    }
    if (currentToken !== '') {
      tokens.push(currentToken);
    }
    return tokens;
  }

  const operandStack = [];
  const operatorStack = [];

  // Tokenize the expression
  const tokens = tokenize(expression);

  for (const token of tokens) {
    if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack[operatorStack.length - 1] !== '(') {
        const operator = operatorStack.pop();
        evaluateOperator(operator);
      }
      operatorStack.pop(); // Pop the '(' from the operator stack
    } else if (token === 'and' || token === 'or' || token === 'not') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '('
      ) {
        const operator = operatorStack.pop();
        evaluateOperator(operator);
      }
      operatorStack.push(token);
    } else {
      evaluateOperand(token);
    }
  }

  while (operatorStack.length > 0) {
    const operator = operatorStack.pop();
    evaluateOperator(operator);
  }

  return operandStack.pop();
}

function getState(name) {
  return states[name] || false;
}

function updateState({set, clear}, render = false) {
  if (set) {
    set.forEach(state => setState(state, false));
  }
  if (clear) {
    set.forEach(state => clearState(state, false));
  }
  if (render) {
    renderState();
  }
}

function setState(name, render = true) {
  states[name] = true;
  if (render) {
    renderState();
  }
}

function clearState(name, render = true) {
  delete states[name];
  if (render) {
    renderState();
  }
}

// Evaluate some boolean expressions
// states = { x: true, y: false, z: true };
// console.log('false', evaluateExpression('x and y')); // Output: false
// console.log('true', evaluateExpression('x and z')); // Output: false
// console.log('true', evaluateExpression('not x or z')); // Output: true
// console.log('false', evaluateExpression('not x and z')); // Output: true
// console.log('false', evaluateExpression('not x')); // Output: false
// console.log('true', evaluateExpression('not y')); // Output: false
// console.log('false', evaluateExpression('(x and z) and y')); // Output: true
// console.log('true', evaluateExpression('(x and z) and (not y)')); // Output: true
// console.log('false', evaluateExpression('not (x and z)'));

// Custom HTML elements
class LocationElement extends HTMLElement {

  onEntry(fn) {
    this.addEventListener('entry', ({detail: {location}}) => fn(location));
    return this;
  }

  onExit(fn) {
    this.addEventListener('exit', ({detail: {location}}) => fn(location));
    return this;
  }

  emitEntry() {
    this.dispatchEvent(new CustomEvent('entry', {
      bubbles: true,
      cancelable: true,
      detail: { location: this },
    }));
  }

  emitExit() {
    this.dispatchEvent(new CustomEvent('exit', {
      bubbles: true,
      cancelable: true,
      detail: { location: this },
    }));
  }

  connectedCallback() {
    this.style.display = 'none';
  }
}

class ItemElement extends HTMLElement {
}

class SwitchElement extends HTMLElement {
}

class CaseElement extends HTMLElement {
}

class ElseElement extends HTMLElement {
}

class IfElement extends HTMLElement {
}

customElements.define(locationTag, LocationElement);
customElements.define(itemTag, ItemElement);
customElements.define(switchTag, SwitchElement);
customElements.define(caseTag, CaseElement);
customElements.define(elseTag, ElseElement);
customElements.define(ifTag, IfElement);

// Location functions
function setLocation(id) {
  const newLocation = getElementById(id);
  if (currentLocation) {
    currentLocation.style.display = 'none';
    clearState(`location-${currentLocation.id}`, false);
    setState(`${currentLocation.id}-seen`, false);
    heldItems.forEach(item => clearState(`${item.id}-${currentLocation.id}`, false));
    currentLocation.querySelectorAll(nestedItemSelector).forEach(item => clearState(`${item.id}-present`, false));
    currentLocation.emitExit();
  }
  currentLocation = newLocation;
  setState(`location-${newLocation.id}`, false);
  heldItems.forEach(item => setState(`${item.id}-${newLocation.id}`, false));
  heldItems.forEach(item => currentLocation.appendChild(item));
  currentLocation.querySelectorAll(nestedItemSelector).forEach(item => setState(`${item.id}-present`, false));
  newLocation.emitEntry();
  renderState();
  newLocation.style.display = 'block';
}

function getLocation(id) {
  return getElementById(id);
}

function getLocations() {
  return [...document.getElementsByTagName(locationTag)];
}

// Item functions
function takeItem(id) {
  const item = getElementById(id);
  // item.dispatchEvent(new CustomEvent('ontake'));
  setState(`${id}-held`);
  heldItems.push(item);
  // item.dispatchEvent(new CustomEvent('onmove')); // TODO
}

function dropItem(id) {
  // item.dispatchEvent(new CustomEvent('ondrop'));
  clearState(`${id}-held`);
  item = getItem(id);
  heldItems = heldItems.filter(i => i !== item);
  // item.dispatchEvent(new CustomEvent('onmove')); // TODO
}

function getItem(id) {
  return getElementById(id);
}

function getItems(container = document) {
  return [...container.querySelectorAll(nestedItemSelector)];
}

// Rendering functions
function renderSwitches() {
  const switches = [...currentLocation.querySelectorAll(nestedSwitchSelector)];
  for (const switchEl of switches) {
    renderSwitch(switchEl);
  }
}

function renderSwitch(switchEl) {
  const cases = [...switchEl.querySelectorAll(childCaseSelector)];
  const elseEl = switchEl.querySelector(childElseSelector);
  let visibleCase = null;
  for (const caseEl of cases) {
    const stateExpression = caseEl.getAttribute('state');
    if (stateExpression && evaluateStateExpression(stateExpression)) {
      visibleCase = caseEl;
      break;
    }
  }

  for (const caseEl of cases) {
    caseEl.style.display = caseEl === visibleCase ? 'inline' : 'none';
  }

  if (elseEl) {
    elseEl.style.display = visibleCase ? 'none' : 'inline';
  }
}

function renderIfs() {
  const ifs = [...currentLocation.querySelectorAll(nestedIfSelector)];
  for (const ifEl of ifs) {
    renderIf(ifEl)
  }
}

function renderIf(ifEl) {
  let elseEl = ifEl.nextElementSibling instanceof ElseElement ? ifEl.nextElementSibling : null;
  const stateExpression = ifEl.getAttribute('state');
  if (stateExpression && evaluateStateExpression(stateExpression)) {
    ifEl.style.display = 'inline';
    if (elseEl) {
      elseEl.style.display = 'none';
    }
  } else {
    ifEl.style.display = 'none';
    if (elseEl) {
      elseEl.style.display = 'inline';
    }
  }
}

function renderState() {
  renderSwitches();
  renderIfs();
}


// Initialization
let loadFn;
function onLoad(fn) {
    loadFn = fn;
}

function init() {
  const locations = [...document.getElementsByTagName(locationTag)];
  for (const location of locations) {
    location.style.display = 'none';
  }  
  if (loadFn) {
    loadFn();
  }
  if (!currentLocation) {
    setLocation(locations[0].id);
  }
}

window.addEventListener('DOMContentLoaded', init);

