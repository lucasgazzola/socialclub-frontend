import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui';
import type { InscripcionFormValues } from '../schemas/inscripcion.schema';

interface DatosNuevoParticipanteFormProps {
  register: UseFormRegister<InscripcionFormValues>;
  errors: FieldErrors<InscripcionFormValues>;
}

/** Datos personales para dar de alta un participante nuevo (modo 2 del DTO). */
export function DatosNuevoParticipanteForm({ register, errors }: DatosNuevoParticipanteFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
      <Input label="DNI" error={errors.dni?.message} {...register('dni')} />
      <Input
        label="Fecha de nacimiento"
        type="date"
        error={errors.fechaNacimiento?.message}
        {...register('fechaNacimiento')}
      />
      <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
      <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
    </div>
  );
}