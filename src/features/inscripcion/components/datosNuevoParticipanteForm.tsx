import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { DateInput, Input } from '@/components/ui';
import type { InscripcionFormValues } from '../schemas/inscripcion.schema';

interface DatosNuevoParticipanteFormProps {
  register: UseFormRegister<InscripcionFormValues>;
  control: Control<InscripcionFormValues>;
  errors: FieldErrors<InscripcionFormValues>;
}

/** Datos personales para dar de alta un participante nuevo (modo 2 del DTO). */
export function DatosNuevoParticipanteForm({ register, control, errors }: DatosNuevoParticipanteFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <Input label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
      <Input label="DNI" error={errors.dni?.message} {...register('dni')} />
      <Controller
        control={control}
        name="fechaNacimiento"
        render={({ field }) => (
          <DateInput
            id="fechaNacimiento"
            label="Fecha de nacimiento"
            error={errors.fechaNacimiento?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />
      <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
      <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
    </div>
  );
}