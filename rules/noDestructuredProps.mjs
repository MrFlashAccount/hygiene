import { getReactExportName } from "./reactBinding.mjs";

const COMPONENT_ARGUMENT_APIS = new Set(["createElement", "forwardRef", "memo"]);
const COMPONENT_TYPES = new Set(["FC", "FunctionComponent"]);
const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);
const TYPE_WRAPPERS = new Set([
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);
const COMPONENT_NAME = /^[A-Z]/u;

const outerExpression = (node) => {
  let expression = node;
  while (TYPE_WRAPPERS.has(expression.parent.type)) {
    expression = expression.parent;
  }
  return expression;
};

const isComponentArgument = (sourceCode, node) => {
  const expression = outerExpression(node);
  const call = expression.parent;
  return (
    call.type === "CallExpression" &&
    call.arguments[0] === expression &&
    COMPONENT_ARGUMENT_APIS.has(getReactExportName(sourceCode, call.callee))
  );
};

const isComponentReference = (sourceCode, identifier) => {
  if (identifier.type === "JSXIdentifier") {
    return identifier.parent.type === "JSXOpeningElement" && identifier.parent.name === identifier;
  }
  return isComponentArgument(sourceCode, identifier);
};

const getDefinition = (node) => {
  if (node.type === "FunctionDeclaration") {
    return node;
  }
  const parent = outerExpression(node).parent;
  return parent.type === "VariableDeclarator" && parent.id.type === "Identifier"
    ? parent
    : undefined;
};

const hasComponentUse = (sourceCode, definition) => {
  if (!definition?.id) {
    return false;
  }
  const binding = sourceCode
    .getDeclaredVariables(definition)
    .find((variable) => variable.identifiers.includes(definition.id));
  // A later JSX or wrapper use of a reassigned binding need not refer to this function.
  return (
    binding !== undefined &&
    !binding.references.some((ref) => ref.isWrite() && !ref.init) &&
    binding.references.some((ref) => isComponentReference(sourceCode, ref.identifier))
  );
};

const hasComponentType = (sourceCode, definition) => {
  const type = definition?.id?.typeAnnotation?.typeAnnotation;
  return (
    type?.type === "TSTypeReference" &&
    COMPONENT_TYPES.has(getReactExportName(sourceCode, type.typeName))
  );
};

const hasExplicitComponentRole = (sourceCode, node, definition) =>
  isComponentArgument(sourceCode, node) ||
  hasComponentType(sourceCode, definition) ||
  hasComponentUse(sourceCode, definition);

const hasComponentNameOrDefault = (node, definition) => {
  if (definition?.id) {
    return COMPONENT_NAME.test(definition.id.name);
  }
  return (
    outerExpression(node).parent.type === "ExportDefaultDeclaration" &&
    (!node.id || COMPONENT_NAME.test(node.id.name))
  );
};

// An element is truthy, so the left operand of && cannot be its rendered result.
const logicalRendersElement = (sourceCode, node) =>
  isRenderResult(sourceCode, node.right) ||
  (node.operator !== "&&" && isRenderResult(sourceCode, node.left));

const isRenderResult = (sourceCode, node) => {
  switch (node.type) {
    case "JSXElement":
    case "JSXFragment":
      return true;
    case "CallExpression":
      return getReactExportName(sourceCode, node.callee) === "createElement";
    case "ConditionalExpression":
      return (
        isRenderResult(sourceCode, node.consequent) || isRenderResult(sourceCode, node.alternate)
      );
    case "LogicalExpression":
      return logicalRendersElement(sourceCode, node);
    default:
      return TYPE_WRAPPERS.has(node.type) && isRenderResult(sourceCode, node.expression);
  }
};

const enclosingFunction = (node) => {
  let parent = node.parent;
  while (parent && !FUNCTION_TYPES.has(parent.type)) {
    parent = parent.parent;
  }
  return parent;
};

const getPropsPattern = (node) => {
  const parameter = node.params[0];
  const pattern = parameter?.type === "AssignmentPattern" ? parameter.left : parameter;
  return pattern?.type === "ObjectPattern" ? pattern : undefined;
};

export const noDestructuredProps = {
  create(context) {
    const { sourceCode } = context;
    const pending = new WeakMap();
    const report = (pattern) => context.report({ messageId: "destructuredProps", node: pattern });
    const checkFunction = (node) => {
      const pattern = getPropsPattern(node);
      if (!pattern || node.generator) {
        return;
      }
      const definition = getDefinition(node);
      if (hasExplicitComponentRole(sourceCode, node, definition)) {
        report(pattern);
        return;
      }
      if (!hasComponentNameOrDefault(node, definition)) {
        return;
      }
      if (node.body.type === "BlockStatement") {
        pending.set(node, pattern);
      } else if (isRenderResult(sourceCode, node.body)) {
        report(pattern);
      }
    };
    return {
      ArrowFunctionExpression: checkFunction,
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ReturnStatement(node) {
        const owner = enclosingFunction(node);
        const pattern = pending.get(owner);
        if (pattern && node.argument && isRenderResult(sourceCode, node.argument)) {
          report(pattern);
          pending.delete(owner);
        }
      },
    };
  },
  meta: {
    messages: {
      destructuredProps:
        "Accept props as one parameter. Destructure inside the component body if needed.",
    },
    schema: [],
    type: "problem",
  },
};
