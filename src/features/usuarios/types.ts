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
    /** DT-42: disciplinas a cargo (solo delegados). */
    disciplinas?: { id: number; nombre: string }[];
}

export interface CreateUsuarioDto {
    dni: string;
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    roles: string[];
    /** DT-42: disciplinas a cargo; solo para el rol DELEGADO. */
    disciplinasIds?: number[];
}

export interface UpdateUsuarioDto {
    dni?: string;
    email?: string;
    nombre?: string;
    apellido?: string;
    password?: string;
    currentPassword?: string;
    roles?: string[];
    disciplinasIds?: number[];
    activo?: boolean;
}

export interface GetUsuariosParams {
    busqueda?: string;
    rolId?: number;
    estado?: 'todos' | 'activos' | 'inactivos';
    pagina?: number;
    porPagina?: number;
}
