export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: () => [...usuariosKeys.all, 'list'] as const,
};
