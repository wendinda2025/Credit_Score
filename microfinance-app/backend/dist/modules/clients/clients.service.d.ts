import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/client.dto';
export declare class ClientsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateClientDto): Promise<{
        id: string;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ClientType;
        status: import(".prisma/client").$Enums.ClientStatus;
        externalId: string | null;
        companyName: string | null;
        dateOfBirth: Date | null;
        phone: string | null;
        address: string | null;
        photoUrl: string | null;
        managedById: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ClientType;
        status: import(".prisma/client").$Enums.ClientStatus;
        externalId: string | null;
        companyName: string | null;
        dateOfBirth: Date | null;
        phone: string | null;
        address: string | null;
        photoUrl: string | null;
        managedById: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ClientType;
        status: import(".prisma/client").$Enums.ClientStatus;
        externalId: string | null;
        companyName: string | null;
        dateOfBirth: Date | null;
        phone: string | null;
        address: string | null;
        photoUrl: string | null;
        managedById: string | null;
    }>;
}
