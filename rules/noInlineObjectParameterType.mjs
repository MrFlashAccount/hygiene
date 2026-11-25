// The nearest annotation owns the type. Do not cross into a different declaration,
// report a nested literal twice, or treat a generic constraint as a parameter.
const TYPE_BOUNDARIES = new Set(["TSTypeAnnotation", "TSTypeLiteral", "TSTypeParameter"]);

const isParameterAnnotation = (annotation) => {
  let binding = annotation.parent;
  if (binding.typeAnnotation !== annotation) {
    return false;
  }

  if (binding.parent.type === "AssignmentPattern" && binding.parent.left === binding) {
    binding = binding.parent;
  }
  if (binding.parent.type === "TSParameterProperty") {
    binding = binding.parent;
  }
  return binding.parent.params?.includes(binding) === true;
};

export const noInlineObjectParameterType = {
  create(context) {
    return {
      TSTypeLiteral(node) {
        let owner = node.parent;
        while (owner.type.startsWith("TS") && !TYPE_BOUNDARIES.has(owner.type)) {
          owner = owner.parent;
        }
        if (owner.type === "TSTypeAnnotation" && isParameterAnnotation(owner)) {
          context.report({ messageId: "nameParameterType", node });
        }
      },
    };
  },
  meta: {
    messages: {
      nameParameterType:
        "Use a named type or interface for this parameter's object shape instead of an inline object type.",
    },
    schema: [],
    type: "suggestion",
  },
};
