/**
 * ESLint rule: require-auth-in-server-actions
 *
 * Errors when:
 *  - a file contains `"use server"` AND
 *  - a server action is exported AND
 *  - it does NOT call requireAuth() or is NOT wrapped in withAuth()
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Server actions must call requireAuth()',
    },
    schema: [],
  },

  create(context) {
    let isServerFile = false;

    return {
      Program(node) {
        // Detect presence of `"use server"`
        const hasUseServer = node.body.some(
          (stmt) =>
            stmt.type === 'ExpressionStatement' &&
            stmt.expression.type === 'Literal' &&
            stmt.expression.value === 'use server',
        );

        if (hasUseServer) isServerFile = true;
      },

      ExportNamedDeclaration(node) {
        if (!isServerFile) return;

        // Only handle exported functions
        if (node.declaration?.type === 'FunctionDeclaration') {
          const func = node.declaration;

          const source = context.getSourceCode().getText(func);

          const callsRequireAuth = source.includes('requireAuth(');
          const wrappedWithAuth = source.includes('withAuth(');

          if (!callsRequireAuth && !wrappedWithAuth) {
            context.report({
              node: func,
              message:
                'Server actions must be protected using requireAuth() or wrapped in withAuth().',
            });
          }
        }

        // Handle exported const actions (e.g. export const foo = async () => {...})
        if (node.declaration?.type === 'VariableDeclaration' && isServerFile) {
          node.declaration.declarations.forEach((decl) => {
            if (
              decl.init &&
              (decl.init.type === 'ArrowFunctionExpression' ||
                decl.init.type === 'FunctionExpression')
            ) {
              const source = context.getSourceCode().getText(decl.init);

              const callsRequireAuth = source.includes('requireAuth(');
              const wrappedWithAuth = source.includes('withAuth(');

              if (!callsRequireAuth && !wrappedWithAuth) {
                context.report({
                  node: decl,
                  message:
                    'Server actions must be protected using requireAuth() or wrapped in withAuth().',
                });
              }
            }
          });
        }
      },
    };
  },
};
