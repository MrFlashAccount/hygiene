const ALLOWED_UNSAFE_DIRECTIVES = new Set([
  "eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion",
  "oxlint-disable-next-line typescript/no-unsafe-type-assertion",
]);
const PREVIOUS_COMMENT_INDEX = -2;
const EFFECT_HOOKS = new Set(["useEffect", "useInsertionEffect", "useLayoutEffect"]);
const AMBIENT_CAPABILITIES = new Map([
  ["EventSource", "Inject a transport capability instead of opening EventSource from UI code."],
  ["WebSocket", "Inject a transport capability instead of opening WebSocket from UI code."],
  ["fetch", "Inject an HTTP capability instead of calling fetch from UI code."],
  ["indexedDB", "Inject a storage capability instead of reading IndexedDB from UI code."],
  ["localStorage", "Inject a storage capability instead of reading localStorage from UI code."],
  ["sessionStorage", "Inject a storage capability instead of reading sessionStorage from UI code."],
]);
const GLOBAL_OBJECTS = new Set(["globalThis", "self", "window"]);
const STATEMENT_BOUNDARIES = new Set(["BlockStatement", "Program", "StaticBlock", "SwitchCase"]);

const isTypeAssertion = (node) => node.type === "TSAsExpression" || node.type === "TSTypeAssertion";

const isConstAssertion = (node) =>
  node.type === "TSAsExpression" &&
  node.typeAnnotation.type === "TSTypeReference" &&
  node.typeAnnotation.typeName.type === "Identifier" &&
  node.typeAnnotation.typeName.name === "const";

const isAnyType = (node) => node.type === "TSAnyKeyword";

const isWhitespaceOnly = (sourceCode, left, right) =>
  sourceCode.text.slice(left.range[1], right.range[0]).trim() === "";

const isImmediatelyBefore = (left, right) => left.loc.end.line + 1 === right.loc.start.line;

const getStatementAnchor = (node) => {
  let anchor = node;

  while (anchor.parent && !STATEMENT_BOUNDARIES.has(anchor.parent.type)) {
    anchor = anchor.parent;
  }

  return anchor;
};

const isJustification = (comment) => {
  const value = comment.value.trim();
  return value !== "" && !value.startsWith("eslint-") && !value.startsWith("oxlint-");
};

const hasDirectiveJustification = ({ anchor, comments, directiveComment, sourceCode }) => {
  const justificationComment = comments.at(PREVIOUS_COMMENT_INDEX);

  return (
    justificationComment !== undefined &&
    isWhitespaceOnly(sourceCode, justificationComment, directiveComment) &&
    isImmediatelyBefore(justificationComment, directiveComment) &&
    isWhitespaceOnly(sourceCode, directiveComment, anchor) &&
    isImmediatelyBefore(directiveComment, anchor) &&
    isJustification(justificationComment)
  );
};

const findJustification = (sourceCode, node) => {
  const anchor = getStatementAnchor(node);
  const comments = sourceCode
    .getAllComments()
    .filter((comment) => comment.range[1] <= anchor.range[0]);
  const nearestComment = comments.at(-1);

  if (!nearestComment) {
    return false;
  }

  if (ALLOWED_UNSAFE_DIRECTIVES.has(nearestComment.value.trim())) {
    return hasDirectiveJustification({
      anchor,
      comments,
      directiveComment: nearestComment,
      sourceCode,
    });
  }

  return (
    isJustification(nearestComment) &&
    isWhitespaceOnly(sourceCode, nearestComment, anchor) &&
    isImmediatelyBefore(nearestComment, anchor)
  );
};

const requireTypeAssertionJustification = {
  create(context) {
    const checkAssertion = (node) => {
      if (isTypeAssertion(node.parent) || isConstAssertion(node)) {
        return;
      }

      if (isAnyType(node.typeAnnotation)) {
        context.report({ messageId: "explicitAny", node });
        return;
      }

      if (isTypeAssertion(node.expression)) {
        context.report({ messageId: "nestedAssertion", node });
        return;
      }

      if (!findJustification(context.sourceCode, node)) {
        context.report({ messageId: "missingJustification", node });
      }
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
  meta: {
    messages: {
      explicitAny: "Type assertions to any are forbidden.",
      missingJustification:
        "Type assertion requires an adjacent comment explaining why it is necessary and cannot be avoided.",
      nestedAssertion: "Nested type assertions are forbidden.",
    },
    schema: [],
    type: "problem",
  },
};

const getPropertyName = (memberExpression) => {
  if (!memberExpression.computed && memberExpression.property.type === "Identifier") {
    return memberExpression.property.name;
  }

  if (
    memberExpression.computed &&
    memberExpression.property.type === "Literal" &&
    typeof memberExpression.property.value === "string"
  ) {
    return memberExpression.property.value;
  }

  return undefined;
};

const getImportedName = (specifier) => {
  if (specifier.imported.type === "Identifier") {
    return specifier.imported.name;
  }

  return typeof specifier.imported.value === "string" ? specifier.imported.value : undefined;
};

const findVariable = (sourceCode, identifier) => {
  let scope = sourceCode.getScope(identifier);

  while (scope) {
    const variable = scope.set.get(identifier.name);
    if (variable) {
      return variable;
    }

    scope = scope.upper;
  }

  return undefined;
};

const findReactImportSpecifier = (sourceCode, identifier) => {
  const variable = findVariable(sourceCode, identifier);
  const importDefinition = variable?.defs.find(
    (definition) =>
      definition.type === "ImportBinding" &&
      definition.parent?.type === "ImportDeclaration" &&
      definition.parent.source.value === "react",
  );

  return importDefinition?.node;
};

const getDirectReactEffect = (sourceCode, identifier) => {
  const specifier = findReactImportSpecifier(sourceCode, identifier);
  if (specifier?.type !== "ImportSpecifier") {
    return undefined;
  }

  const importedName = getImportedName(specifier);
  return importedName && EFFECT_HOOKS.has(importedName) ? importedName : undefined;
};

const getQualifiedReactEffect = (sourceCode, memberExpression) => {
  if (memberExpression.object.type !== "Identifier") {
    return undefined;
  }

  const specifier = findReactImportSpecifier(sourceCode, memberExpression.object);
  if (!specifier || specifier.type === "ImportSpecifier") {
    return undefined;
  }

  const propertyName = getPropertyName(memberExpression);
  return propertyName && EFFECT_HOOKS.has(propertyName) ? propertyName : undefined;
};

const getReactEffect = (sourceCode, callee) => {
  if (callee.type === "Identifier") {
    return getDirectReactEffect(sourceCode, callee);
  }

  return callee.type === "MemberExpression"
    ? getQualifiedReactEffect(sourceCode, callee)
    : undefined;
};

const noAmbientCapabilities = {
  create(context) {
    const reportCapability = (node, capability) => {
      context.report({
        data: { capability, replacement: AMBIENT_CAPABILITIES.get(capability) },
        messageId: "ambientCapability",
        node,
      });
    };

    return {
      Identifier(node) {
        if (AMBIENT_CAPABILITIES.has(node.name) && context.sourceCode.isGlobalReference(node)) {
          reportCapability(node, node.name);
        }
      },
      MemberExpression(node) {
        const capability = getPropertyName(node);

        if (
          capability &&
          AMBIENT_CAPABILITIES.has(capability) &&
          node.object.type === "Identifier" &&
          GLOBAL_OBJECTS.has(node.object.name) &&
          context.sourceCode.isGlobalReference(node.object)
        ) {
          reportCapability(node, capability);
        }
      },
    };
  },
  meta: {
    messages: {
      ambientCapability: "Direct {{capability}} access is forbidden in UI code. {{replacement}}",
    },
    schema: [],
    type: "problem",
  },
};

const noDirectEffects = {
  create(context) {
    return {
      CallExpression(node) {
        const hook = getReactEffect(context.sourceCode, node.callee);

        if (hook) {
          context.report({ data: { hook }, messageId: "directEffect", node });
        }
      },
    };
  },
  meta: {
    messages: {
      directEffect:
        "Direct {{hook}} usage is forbidden. Put synchronization behind an explicitly named boundary hook.",
    },
    schema: [],
    type: "problem",
  },
};

export default {
  meta: {
    name: "hygiene",
  },
  rules: {
    "no-ambient-capabilities": noAmbientCapabilities,
    "no-direct-effects": noDirectEffects,
    "require-type-assertion-justification": requireTypeAssertionJustification,
  },
};
