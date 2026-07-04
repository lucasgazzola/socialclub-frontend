export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string | null;
}

export interface Usuario {
    id: number;
    email: string;
    nombre?: string;
    apellido?: string;
    activo: boolean;
    ultimoLogin?: string | null;
    creadoEn: string;
    roles: { rol: Rol }[];
}

export interface CreateUsuarioDto {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    roles: string[];
}

export interface UpdateUsuarioDto {
    nombre?: string;
    apellido?: string;
    roles?: string[];
    activo: boolean;
}