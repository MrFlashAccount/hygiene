const ALLOWED_UNSAFE_DIRECTIVES = new Set([
  "eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion",
  "oxlint-disable-next-line typescript/no-unsafe-type-assertion",
]);
const PREVIOUS_COMMENT_INDEX = -2;
const EFFECT_HOOKS = new Set(["useEffect", "useInsertionEffect", "useLayoutEffect"]);
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

const noDirectEffects = {
  create(context) {
    const directBindings = new Map();
    const reactNamespaces = new Set();

    return {
      CallExpression(node) {
        let hook;

        if (node.callee.type === "Identifier") {
          hook = directBindings.get(node.callee.name);
        } else if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          reactNamespaces.has(node.callee.object.name)
        ) {
          const propertyName = getPropertyName(node.callee);
          if (propertyName && EFFECT_HOOKS.has(propertyName)) {
            hook = propertyName;
          }
        }

        if (hook) {
          context.report({ data: { hook }, messageId: "directEffect", node });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value !== "react") {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") {
            const importedName = getImportedName(specifier);
            if (importedName && EFFECT_HOOKS.has(importedName)) {
              directBindings.set(specifier.local.name, importedName);
            }
          } else {
            reactNamespaces.add(specifier.local.name);
          }
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
    "no-direct-effects": noDirectEffects,
    "require-type-assertion-justification": requireTypeAssertionJustification,
  },
};
