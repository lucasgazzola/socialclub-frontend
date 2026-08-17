export interface Role {
    id: number;
    name: string;
    description?: string | null;
}

export interface User {
    id: number;
    dni?: string | null;
    email: string;
    name: string;
    lastName: string;
    active: boolean;
    lastLogin?: string | null;
    createdAt: string;
    updatedAt?: string;
    roles: { role: Role }[];
}

export interface CreateUserDto {
    dni: string;
    email: string;
    password: string;
    name: string;
    lastName: string;
    roles: string[];
}

export interface UpdateUserDto {
    dni?: string;
    email?: string;
    name?: string;
    lastName?: string;
    password?: string;
    currentPassword?: string;
    roles?: string[];
    active?: boolean;
}