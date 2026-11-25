export const getPropertyName = (memberExpression) => {
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

const importsByProgram = new WeakMap();

const indexSpecifier = (sourceCode, specifier, imports) => {
  const typeOnly = specifier.importKind === "type" || specifier.parent.importKind === "type";
  const [binding] = sourceCode.getDeclaredVariables(specifier);
  for (const reference of binding.references) {
    if (!typeOnly || reference.isTypeReference) {
      imports.set(reference.identifier, specifier);
    }
  }
};

const isReactImport = (node) => node.type === "ImportDeclaration" && node.source.value === "react";

const indexReactImports = (sourceCode) => {
  const imports = new WeakMap();
  for (const node of sourceCode.ast.body) {
    if (isReactImport(node)) {
      for (const specifier of node.specifiers) {
        indexSpecifier(sourceCode, specifier, imports);
      }
    }
  }
  return imports;
};

// Index resolved references once per file, not names at call sites. In particular, a body-local
// variable is not in scope in a default parameter, even though both have the same function scope.
const findReactImportSpecifier = (sourceCode, identifier) => {
  let imports = importsByProgram.get(sourceCode.ast);
  if (!imports) {
    imports = indexReactImports(sourceCode);
    importsByProgram.set(sourceCode.ast, imports);
  }
  return imports.get(identifier);
};

const isReactNamespace = (sourceCode, node) => {
  const specifier = findReactImportSpecifier(sourceCode, node);
  return (
    specifier !== undefined &&
    (specifier.type !== "ImportSpecifier" || getImportedName(specifier) === "default")
  );
};

export const getReactExportName = (sourceCode, node) => {
  switch (node.type) {
    case "Identifier": {
      const specifier = findReactImportSpecifier(sourceCode, node);
      return specifier?.type === "ImportSpecifier" ? getImportedName(specifier) : undefined;
    }
    case "MemberExpression":
      return isReactNamespace(sourceCode, node.object) ? getPropertyName(node) : undefined;
    case "TSQualifiedName":
      return isReactNamespace(sourceCode, node.left) ? node.right.name : undefined;
    default:
      return undefined;
  }
};
