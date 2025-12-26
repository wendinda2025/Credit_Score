import { ClientType } from '@prisma/client';
export declare class CreateClientDto {
    firstName: string;
    lastName?: string;
    type: ClientType;
    dateOfBirth?: string;
    phone?: string;
}
