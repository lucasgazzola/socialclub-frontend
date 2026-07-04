import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { UsuarioForm } from '../components/UsuarioForm';
import { useCreateUsuario } from '../hooks/useCreateUsuario';

export function UsuariosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const createUsuario = useCreateUsuario();

  async function handleCreate(values: any) {
    await createUsuario.mutateAsync(values);
    setMostrarFormulario(false);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios administrativos</h1>
          <p className="text-sm text-slate-500">
            Gestión de usuarios del sistema
          </p>
        </div>

        <Button onClick={() => setMostrarFormulario(v => !v)}>
          {mostrarFormulario ? 'Cancelar' : 'Nuevo usuario'}
        </Button>
      </header>
      

      {/* FORM */}
      {mostrarFormulario && (
        <Card className="p-6">
          <UsuarioForm onSubmit={handleCreate} />
        </Card>
      )}

    </div>
  );
}