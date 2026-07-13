export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string | null;
}

export interface Usuario {
    id: number;
    dni?: string | null;
    email: string;
    nombre: string;
    apellido: string;
    activo: boolean;
    ultimoLogin?: string | null;
    creadoEn: string;
    actualizadoEn?: string;
    roles: { rol: Rol }[];
}

export interface CreateUsuarioDto {
    dni: string;
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    roles: string[];
}

export interface UpdateUsuarioDto {
    dni?: string;
    email?: string;
    nombre?: string;
    apellido?: string;
    password?: string;
    currentPassword?: string;
    roles?: string[];
    activo?: boolean;
}